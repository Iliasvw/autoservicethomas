const cron = require('node-cron');
const { checkCarNotifications } = require('./notificationService');

cron.schedule('0 0 * * *', () => {
  checkCarNotifications()
    .then(() => console.log('Melding check uitgevoerd'))
    .catch(console.error);
});