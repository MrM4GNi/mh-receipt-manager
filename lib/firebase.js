// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {  getFirestore, setDoc, getDoc, doc, updateDoc, arrayUnion, increment, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, initializeAuth, getReactNativePersistence, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
//const firebaseConfig = {
//  apiKey: "AIzaSyAZdxYO0vfx-i2Kksk1Unto4N-DfRhVRNw",
//  authDomain: "household-receipt.firebaseapp.com",
//  projectId: "household-receipt",
//  storageBucket: "household-receipt.appspot.com",
//  messagingSenderId: "474916163629",
//  appId: "1:474916163629:web:5149efeac38feafe82e8a4",
//  measurementId: "G-EMSYSYGLXC"
//};

const firebaseConfig = {
    apiKey: "AIzaSyAp4EJN0N0W82MS1qicYlJnr8WxJQ8j_eA",
    authDomain: "besafe-official.firebaseapp.com",
    databaseURL: "https://besafe-official-default-rtdb.firebaseio.com",
    projectId: "besafe-official",
    storageBucket: "besafe-official.appspot.com",
    messagingSenderId: "568575958633",
    appId: "1:568575958633:web:c12aaea78e59f0eff28cf8",
    measurementId: "G-759G5PY302"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(app)
});
export const db = getFirestore(app);

//Sign Up User
export async function signUp(data) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userId = userCredential.user.uid;

        const userDocRef = doc(db, 'Users', userId);
        const { password: _, confirmPassword: __, ...updatedForm } = data;
        await setDoc(userDocRef, {
            userId: userId,
            ...updatedForm,
            group: [],
        });

        await sendEmailVerification(userCredential.user);
        return userDocRef.id;
    } catch (error) {
        throw new Error(error);
    }
}

//Sign In User
export async function signIn(data) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Fetch additional user info from Firestore
        const userDocRef = doc(db, 'Users', user.uid); // Assuming userId is the same as uid
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();

            await AsyncStorage.setItem('userId', user.uid);

            return { uid: user.uid, email: user.email, ...userData };   
        } else {
            throw new Error('User is not exist. Please sign up first');
        }
    } catch (error) {
        throw new Error(error.code);
    }
}

//Email Is Verified
export async function emailIsVerify(email) {
    const user = getAuth().currentUser;

    if (user) {
        await user.reload(); // Refresh user data
        if (user.emailVerified) {
            return true;
        } else {
            return false;
        }
    }
}

export async function signOut() {
    try {
        await AsyncStorage.removeItem('userId');

        console.log("Signout: remove userId");
        return true;
    } catch (error) {
        console.log("Signout", error.message);
        throw new Error(error);
    }
}

export async function getCurrentUser(userId) {
    try {
        if (userId) {
            // Parse the user data back to an object
            const userDocRef = doc(db, 'Users', userId);
            const userDoc = await getDoc(userDocRef);
            
            return userDoc.data();
        } else {
            return null; // No user data found
        }
    } catch (error) {
        throw new Error(error);
    }
}

export async function isBoardingShow() {
    try {
        const boardingScreen = await AsyncStorage.getItem('boardingScreen');

        if (boardingScreen !== null)
            return true;
        else 
            return false;
    } catch (error) {
        return false;
    }
}

export async function boardingScreenHide() {
    try {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        
        return true;
    } catch (error) {
        return false;
    }
}

export async function getPersonalExpenses(uid) {
    try {
        const data = await AsyncStorage.getItem(uid);
        if (data !== null) {
            // Parse the user data back to an object
            const exp = JSON.parse(data);
            console.log('Retrieved transaction:', exp);
            return exp;
        } else {
            console.log('No data found');
            return null; // No user data found
        }
    } catch (error) {
        console.error('Failed to retrieve transaction data:', error);
        return null; // Return null on error
    }
}

// Function to add a transaction
export const addTransaction = async (userId, transaction) => {
    try {
        const userDocRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists())
            throw new Error("user not exist");

        const userData = userDoc.data();

        if (userData.scanReceiptLeft === 0 && transaction.receiptPath !== "")
            throw new Error("You can't add receipt you reach your scanning limit");

        if (transaction.receiptPath !== "")
        {
            await updateDoc(userDocRef, {
                transaction: arrayUnion(transaction), // Add transaction to array
                scanReceiptLeft: userData.scanReceiptLeft - 1,
            });
        }
        else {
            await updateDoc(userDocRef, {
                transaction: arrayUnion(transaction), // Add transaction to array
            });
        }

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

//Get Today Transaction
export const getTodayTransactions = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of the day
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999); // Set to end of the day
    
        // Reference the user's transactions collection
        const transactionsRef = collection(db, "Users", userId, "transaction");
    
        // Create a query for today's transactions
        const q = query(
        transactionsRef,
        where("timestamp", ">=", today),
        where("timestamp", "<=", endOfDay)
        );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      return transactions;
    } catch (error) {
      console.error("Error fetching today's transactions: ", error);
      return [];
    }
};

//Upload Receipt
export const uploadReciept = async (uri) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = uri.substring(uri.lastIndexOf('/') + 1);

        const storage = getStorage(app); // Initialize Firebase Storage
        const storageRef = ref(storage, filename); // Create a reference to the file

        // Upload the blob to Firebase Storage
        await uploadBytes(storageRef, blob);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        throw new Error(error);
    }
};

//Create Group
export const createGroup = async (userId, group) => {
    try {
        const newGroupRef = doc(collection(db, 'Groups'));
        const newDocId = newGroupRef.id;

        console.log("group", newDocId);
        await setDoc(newGroupRef, {
            ...group,
            groupId: newDocId
        });

        const userDocRefOwner = doc(db, 'Users', userId);
        const userDocOwner = await getDoc(userDocRefOwner);

        if (userDocOwner.exists())
        {
            const userData = userDocOwner.data();

            await updateDoc(userDocRefOwner, {
                group: arrayUnion({groupId: newDocId}),
                canCreateGroupForSharing: userData.canCreateGroupForSharing - 1,
            });
        }

        if (group.users.length !== 0) {
            group.users.map(async (item) => {
                const userDocRef = doc(db, 'Users', item.userId);

                await updateDoc(userDocRef, {
                    group: arrayUnion({groupId: newDocId})
                });
            });
        }

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

//Find user by email
export const findUserByEmail = async (email) => {
    try {
        const usersRef = collection(db, 'Users');
        const querySnapshot = await getDocs(usersRef);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                userId = doc.id;
            });
            return userId;
        } else {
            return "User Not Found";
        }
    } catch (error) {
        throw new Error(error);
    }
};

//Get Group Info
export const getGroup = async (groupId) => {
    try {
        if (groupId !== null) {
            // Parse the user data back to an object
            const groudDocRef = doc(db, 'Groups', groupId);
            const groudDoc = await getDoc(groudDocRef);

            return { ...groudDoc.data(), groudId: groupId};
        } else {
            return null;
        }
    } catch (error) {
        throw new Error(error);
    }
};

// Function to add group transaction
export const addGroupTransaction = async (groudId, transaction) => {
    const userDocRef = doc(db, 'Groups', groudId);
    const groupDoc = await getDoc(userDocRef);

    try {
        if (!groupDoc.exists())
            throw new Error("Group Not Exist");

        const groupData = groupDoc.data();
        const userDocRef2 = doc(db, 'Users', groupData.ownerId);
        const userDoc = await getDoc(userDocRef2);

        if (!userDoc.exists())
            throw new Error("Owner Not Exist");

        const userData = userDoc.data();

        if (userData.scanReceiptLeft === 0 && transaction.receiptPath !== "")
            throw new Error("You can't add receipt");

        await updateDoc(userDocRef, {
            transaction: arrayUnion(transaction) // Add transaction to array
        });

        if (transaction.receiptPath !== "")
            await updateDoc(userDocRef2, {
                scanReceiptLeft: userData.scanReceiptLeft - 1,
            });

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

// Remove a user
export const removeUser = async (groupId) => {
    try {
        const groupRef = doc(db, "Groups", groupId);

        await updateDoc(groupRef, {
            users: []
        });
        return true;
    } catch (error) {
        throw new Error(error);
    }
};

//Add new member
export const addGroupMember = async (groupId, updateGroup) => {
    try {
        if (!Array.isArray(updateGroup.users)) {
            throw new Error("Users should be an array.");
        }

        const groupRef = doc(db, "Groups", groupId);

        await updateDoc(groupRef, {
            name: updateGroup.name,
            budget: updateGroup.budget,
            users: []
        });

        if (updateGroup.users !== null && updateGroup.users.length !== 0)
        {
            await updateDoc(groupRef, {
                users: updateGroup.users
            });

            const userUpdatePromises = updateGroup.users.map(async (item) => {
                const userDocRef = doc(db, 'Users', item.userId);
                return await updateDoc(userDocRef, {
                    group: arrayUnion({ groupId: groupId })
                });
            });

            await Promise.all(userUpdatePromises);
        }

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

export async function upgradeSubcription(userId, item) {
    try {
        if (userId !== null) {
            // Parse the user data back to an object
            const userDocRef = doc(db, 'Users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists())
            {
                const userData = userDoc.data();

                await updateDoc(userDocRef, {
                    accountType: item.plan,
                    storage: item.storage,
                    scanReceipt: item.canReceiptScan,
                    scanReceiptLeft: item.canReceiptScan,
                    canCreateGroupForSharing: userData.canCreateGroupForSharing + item.canCreateGroup
                });
            }

            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error(error);
    }
};

// SAve personal budget limit
export const updateBudgetLimit = async (userId, budget) => {
    const userDocRef = doc(db, 'Users', userId);

    try {
        await updateDoc(userDocRef, {
            budget: budget
        });

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

// SAve group budget limit
export const updateGroupBudgetLimit = async (groudId, transaction) => {
    const userDocRef = doc(db, 'Groups', groudId);

    try {
        await updateDoc(userDocRef, {
            transaction: arrayUnion(transaction)
        });

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

export const saveUserTokenToDatabase = async (userId, token) => {
    const userDocRef = doc(db, 'Users', userId);

    try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.expoPushToken !== token && data.expoPushToken !== null) {
                await updateDoc(userDocRef, {
                    expoPushToken: token
                });
            }
        }

        return true;
    } catch (error) {
        throw new Error(error.code);
    }
};

export const fetchGroupTokens = async (groupId) => {
    try {
        const groudDocRef = doc(db, 'Groups', groupId);
        const groudDoc = await getDoc(groudDocRef);
        const memberTokens = [];
    
        if (groudDoc.exists()) {
            const members = groudDoc.data().users;
            console.log("OwnerId:", groudDoc.data().ownerId)
            const ownerDocRef = doc(db, 'Users', groudDoc.data().ownerId);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (ownerDoc.exists && ownerDoc.data().expoPushToken) {
                memberTokens.push(ownerDoc.data().expoPushToken);
            }

            for (const member of members) {
                const userDocRef = doc(db, 'Users', member.userId);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists && userDoc.data().expoPushToken) {
                    memberTokens.push(userDoc.data().expoPushToken);
                }
            }
        }
    
        return memberTokens;
    } catch (error) {
        throw new Error(error);
    }
};

export const modifiedUserTransaction = async (updatedTransaction) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        const userDocRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userDocRef);
    
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const transactions = userData.transaction;

            const transactionIndex = transactions.findIndex(
                (transaction) => transaction.timestamp === updatedTransaction.timestamp
            );

            if (transactionIndex === -1) {
                console.log('Transaction not found!', updatedTransaction.timestamp);
                return;
            }
          
            transactions[transactionIndex].notes = updatedTransaction.notes;
            transactions[transactionIndex].receiptPath = updatedTransaction.receiptPath;
            transactions[transactionIndex].amount = updatedTransaction.amount;
            transactions[transactionIndex].category = updatedTransaction.category;

          
            await updateDoc(userDocRef, { transaction: transactions });

            return userData;
        }
    } catch (error) {
        throw new Error(error);
    }
};

export const removeTransaction = async (timestamp) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
        const userDocRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userDocRef);
        
      if (!userDoc.exists()) {
        console.log('No such user document!');
        return;
      }
  
      const userData = userDoc.data();
      const transactions = userData.transaction;
  
      const updatedTransactions = transactions.filter(
        (transaction) => transaction.timestamp !== timestamp
      );
  
      await updateDoc(userDocRef, { transaction: updatedTransactions });
      
      return userData;
    } catch (error) {
      console.error('Error removing transaction: ', error);
    }
};

export const modifiedGroupTransaction = async (groupId, updatedTransaction) => {
    try {
        const groudDocRef = doc(db, 'Groups', groupId);
        const groudDoc = await getDoc(groudDocRef);
    
        if (groudDoc.exists()) {
            const userData = groudDoc.data();
            const transactions = userData.transaction;

            const transactionIndex = transactions.findIndex(
                (transaction) => transaction.timestamp === updatedTransaction.timestamp
            );

            if (transactionIndex === -1) {
                console.log('Transaction not found!', updatedTransaction.timestamp);
                return;
            }
          
            transactions[transactionIndex].notes = updatedTransaction.notes;
            transactions[transactionIndex].receiptPath = updatedTransaction.receiptPath;
            transactions[transactionIndex].amount = updatedTransaction.amount;
            transactions[transactionIndex].category = updatedTransaction.category;

          
            await updateDoc(groudDocRef, { transaction: transactions });

            return userData;
        }
    } catch (error) {
        throw new Error(error);
    }
};

export const removeGroupTransaction = async (groupId, timestamp) => {
    try {
        const groudDocRef = doc(db, 'Groups', groupId);
        const groudDoc = await getDoc(groudDocRef);
        
      if (!groudDoc.exists()) {
        console.log('No such user document!');
        return;
      }
  
      const userData = groudDoc.data();
      const transactions = userData.transaction;
  
      const updatedTransactions = transactions.filter(
        (transaction) => transaction.timestamp !== timestamp
      );
  
      await updateDoc(groudDocRef, { transaction: updatedTransactions });
      
      return userData;
    } catch (error) {
      console.error('Error removing transaction: ', error);
    }
};

export const minusUserFreeScanReceipt = async (userId) => {
    try {
        const userDocRefOwner = doc(db, 'Users', userId);
        const userDocOwner = await getDoc(userDocRefOwner);

        if (userDocOwner.exists())
        {
            const userData = userDocOwner.data();

            await updateDoc(userDocRefOwner, {
                scanReceiptLeft: userData.scanReceiptLeft - 1,
            });
        }

        return userData;
    } catch (error) {
        throw new Error(error);
    }
};

export const checkIfBudgetRefresh = async (notes) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        const userDocRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userDocRef);
    
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const transactions = userData.transaction;

            const transactionIndex = transactions.findIndex(
                (transaction) => transaction.notes === notes
            );

            if (transactionIndex === -1) {
                console.log('Transaction not found!');
                return false;
            }

            return true;
        }
    } catch (error) {
        throw new Error(error);
        return true;
    }
};

export const checkIfGroupBudgetRefresh = async (groupId, notes) => {
    try {
        const groudDocRef = doc(db, 'Groups', groupId);
        const groudDoc = await getDoc(groudDocRef);
    
        if (groudDoc.exists()) {
            const userData = groudDoc.data();
            const transactions = userData.transaction;

            const transactionIndex = transactions.findIndex(
                (transaction) => transaction.notes === notes
            );

            if (transactionIndex === -1) {
                console.log('Transaction not found!');
                return false;
            }
          
            return true;
        }
    } catch (error) {
        throw new Error(error);
        return true;
    }
};

export const deleteGroupCollection = async (groupId) => {

    try {
        const groudDocRef = doc(db, 'Groups', groupId);
        const groudDoc = await getDoc(groudDocRef);
    
        if (groudDoc.exists()) {
            const userData = groudDoc.data();

            userData.users.map(async (item) => {
                const userDocRef = doc(db, 'Users', item.userId);
                const members = await getDoc(userDocRef);
                
                if (members.exists()){
                    const memberData = members.data();
                    const groups = memberData.group;
  
                    const updateGroup = groups.filter(
                        (group) => group.groupId !== groupId
                    );
                
                    await updateDoc(userDocRef, { group: updateGroup });
                }
            });
            
            const userDocRefOwner = doc(db, 'Users', userData.ownerId);
            const userDocOwner = await getDoc(userDocRefOwner);

            if (userDocOwner.exists())
            {
                const userData2 = userDocOwner.data();
                const groups = userData2.group;
  
                    const updateGroup = groups.filter(
                        (group) => group.groupId !== groupId
                    );

                await updateDoc(userDocRefOwner, {
                    group: updateGroup,
                    canCreateGroupForSharing: userData2.canCreateGroupForSharing + 1,
                });
            }

            deleteDoc(groudDocRef);
        }

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

export const updateUserInfo = async (userId, user) => {
    try {
        const userDocRefOwner = doc(db, 'Users', userId);
        const userDocOwner = await getDoc(userDocRefOwner);

        if (userDocOwner.exists())
        {
            await updateDoc(userDocRefOwner, {
                fullName: user.fullName,
                mobileNo: user.mobileNo
            });
        }

        return true;
    } catch (error) {
        throw new Error(error);
    }
};

export const forgotPasswordRequest = async (email) => {
    try {
      await sendPasswordResetEmail(getAuth(), email);

      return true;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
};

export const changedPassword = async (currentPassword, newPassword) => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        const userDocRefOwner = doc(db, 'Users', userId);
        const userDocOwner = await getDoc(userDocRefOwner);

        if (!userDocOwner.exists) {
            throw new Error('Users Not Found');
        }

        const userData = userDocOwner.data();

        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, userData.email, currentPassword);
        const user = auth.currentUser;

        const credential = EmailAuthProvider.credential(userData.email, currentPassword);

        console.log("credential", credential);
        await reauthenticateWithCredential(user, credential);
        console.log("credentialss");
        await updatePassword(user, newPassword);
        console.log("credentiala");
        return true;
    } catch (error) {
        throw new Error('Error changing password');
    }
};