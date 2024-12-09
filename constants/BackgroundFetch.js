import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

TaskManager.defineTask('BACKGROUND_FETCH_TASK', async () => {
  try {
    const hasNewData = await checkForChanges();
    if (hasNewData) {
      triggerPushNotification();
    }
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    return BackgroundFetch.Result.Failed;
  }
});

const checkForChanges = async () => {
  // Implement your logic to check for changes (e.g., API call)
  return true; // Return true if there are changes
};

const triggerPushNotification = () => {
  // Logic to send a push notification
};

export const registerBackgroundTask = async () => {
  await BackgroundFetch.registerTaskAsync('BACKGROUND_FETCH_TASK', {
    minimumInterval: 5 * 60,
  });
};
