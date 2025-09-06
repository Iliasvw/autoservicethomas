// utils/createDefaultAdmin.js
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createDefaultAdmin = async () => {
    try {
        const existingMarieke = await User.findOne({ username: 'Marieke' });
        const existingThomas = await User.findOne({ username: 'Thomas' });
        const existingThias = await User.findOne({ username: 'Thias' });
        const password = 'Autoservicethomas1234!';

        if (!existingMarieke) {
            const marieke = new User({
                username: 'Marieke',
                mail: 'marieke@autoservicethomas.be',
                password: password,
            });
            await marieke.save();
            console.log('✅ Admin-gebruiker succesvol aangemaakt (username: Marieke)');
        }

        if (!existingThomas) {
            const thomas = new User({
                username: 'Thomas',
                mail: 'thomas@autoservicethomas.be',
                password: password,
            });
            await thomas.save();
            console.log('✅ Admin-gebruiker succesvol aangemaakt (username: Thomas)');
        }

        if (!existingThias) {
            const thias = new User({
                username: 'Thias',
                mail: 'thias@autoservicethomas.be',
                password: password,
            });
            await thias.save();
            console.log('✅ Admin-gebruiker succesvol aangemaakt (username: Thias)');
        }
    } catch (error) {
        console.error('❌ Fout bij aanmaken admin:', error);
    }
};

module.exports = createDefaultAdmin;
