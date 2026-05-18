const bcrypt = require("bcryptjs");

let storeSettings = {
  storeName: "Hesham Store",
  logoText: "Hesham Store",
  logoImage: "",
  whatsappLink: "",
  instagramLink: "",
  facebookLink: "",
  homepageTitle: "Step Into Style",
  homepageSubtitle: "Discover modern shoes for men, women, and kids.",
};

const getPublicSettings = (req, res) => {
  res.json(storeSettings);
};

const updateStoreSettings = (req, res) => {
  const {
    storeName,
    logoText,
    logoImage,
    whatsappLink,
    instagramLink,
    facebookLink,
    homepageTitle,
    homepageSubtitle,
  } = req.body;

  storeSettings = {
    ...storeSettings,
    storeName: storeName ?? storeSettings.storeName,
    logoText: logoText ?? storeSettings.logoText,
    logoImage: logoImage ?? storeSettings.logoImage,
    whatsappLink: whatsappLink ?? storeSettings.whatsappLink,
    instagramLink: instagramLink ?? storeSettings.instagramLink,
    facebookLink: facebookLink ?? storeSettings.facebookLink,
    homepageTitle: homepageTitle ?? storeSettings.homepageTitle,
    homepageSubtitle: homepageSubtitle ?? storeSettings.homepageSubtitle,
  };

  res.json({
    message: "Store settings updated successfully",
    settings: storeSettings,
  });
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const adminPasswordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required",
      });
    }

    if (!adminPasswordHash) {
      return res.status(500).json({
        message: "ADMIN_PASSWORD_HASH is missing in .env",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      String(currentPassword),
      adminPasswordHash
    );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(String(newPassword), 10);

    process.env.ADMIN_PASSWORD_HASH = newPasswordHash;

    res.json({
      message:
        "Admin password changed successfully. Use the new password next login.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not change admin password",
    });
  }
};

module.exports = {
  getPublicSettings,
  updateStoreSettings,
  changeAdminPassword,
};