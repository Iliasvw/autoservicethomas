function formatDateToDDMMYYYY(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

const checkCarNotifications = async () => {
  const today = new Date();
  const warningPeriodDays = 28; // 4 weken

  const cars = await Car.find({});

  for (const car of cars) {
    // Onderhoud check
    if (car.lastMaintenanceDate) {
      const maintenanceDueDate = new Date(car.lastMaintenanceDate);
      maintenanceDueDate.setFullYear(maintenanceDueDate.getFullYear() + 1);

      const daysToDue = Math.ceil((maintenanceDueDate - today) / (1000 * 60 * 60 * 24));

      if (daysToDue <= warningPeriodDays && daysToDue >= 0) {
        // Kijk of er al een actieve onderhoud melding is
        const existingNotification = await Notification.findOne({
          carId: car._id,
          type: 'onderhoud',
          autoCreate: true,
        });

        if (!existingNotification) {
          await Notification.create({
            carId: car._id,
            type: 'onderhoud',
            message: `Onderhoud bijna nodig. Laatste onderhoud was op ${formatDateToDDMMYYYY(car.maintenanceDate)}`,
            createdAt: new Date(),
          });
        }
      }
    }

    // Keuring check
    if (car.lastInspectionDate) {
      const inspectionDueDate = new Date(car.lastInspectionDate);
      inspectionDueDate.setFullYear(inspectionDueDate.getFullYear() + 1);

      const daysToDue = Math.ceil((inspectionDueDate - today) / (1000 * 60 * 60 * 24));

      if (daysToDue <= warningPeriodDays && daysToDue >= 0) {
        // Kijk of er al een actieve keuring melding is
        const existingNotification = await Notification.findOne({
          carId: car._id,
          type: 'keuring',
          autoCreate: true,
        });

        if (!existingNotification) {
          await Notification.create({
            carId: car._id,
            type: 'keuring',
            message: `Keuring bijna nodig. Laatste keuring was op ${formatDateToDDMMYYYY(car.inspectionDate)}`,
            createdAt: new Date(),
          });
        }
      }
    }
  }
};