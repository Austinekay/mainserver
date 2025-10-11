const Settings = require('../models/settings');

const defaultSettings = [

  { key: 'autoApproveShops', value: false, description: 'Auto-approve new shops', category: 'shop_management' },
  { key: 'maintenanceMode', value: false, description: 'Enable maintenance mode', category: 'system' },
  { key: 'maxShopsPerUser', value: 5, description: 'Maximum shops per user', category: 'shop_management' },
  { key: 'sessionTimeout', value: 30, description: 'Session timeout in minutes', category: 'security' },
  { key: 'backupFrequency', value: 'daily', description: 'Backup frequency', category: 'system' },
];

const initializeSettings = async () => {
  try {
    for (const setting of defaultSettings) {
      const existingSetting = await Settings.findOne({ key: setting.key });
      if (!existingSetting) {
        await Settings.create(setting);
      }
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find({});
    const settingsObject = {};
    
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    // Ensure all default settings are present
    defaultSettings.forEach(defaultSetting => {
      if (!(defaultSetting.key in settingsObject)) {
        settingsObject[defaultSetting.key] = defaultSetting.value;
      }
    });

    res.json({ settings: settingsObject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    const updatedSettings = {};

    for (const [key, value] of Object.entries(settingsData)) {
      const setting = await Settings.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      updatedSettings[key] = setting.value;
    }

    res.json({ 
      message: 'Settings updated successfully', 
      settings: updatedSettings 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSetting = async (key) => {
  try {
    const setting = await Settings.findOne({ key });
    if (setting) {
      return setting.value;
    }
    
    // Return default value if not found
    const defaultSetting = defaultSettings.find(s => s.key === key);
    return defaultSetting ? defaultSetting.value : null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
};

const updateSetting = async (key, value) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return setting.value;
  } catch (error) {
    console.error('Error updating setting:', error);
    return null;
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSetting,
  updateSetting,
  initializeSettings,
};