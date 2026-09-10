import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    organization: {
      orgName: {
        type: String,
        default: "Enterprise Resource Planning",
        trim: true,
      },
      legalEntityName: {
        type: String,
        default: "Enterprise Global Technologies Pvt. Ltd.",
        trim: true,
      },
      registrationNumber: {
        type: String,
        default: "CIN-U72200DL2024PTC123456",
        trim: true,
      },
      supportEmail: {
        type: String,
        default: "support@erp.com",
        trim: true,
        lowercase: true,
      },
      contactPhone: {
        type: String,
        default: "+91 11 4987 6543",
        trim: true,
      },
      timezone: {
        type: String,
        default: "Asia/Kolkata (IST +5:30)",
        trim: true,
      },
      currency: {
        type: String,
        default: "INR (₹)",
        trim: true,
      },
      fiscalYear: {
        type: String,
        default: "April - March",
        trim: true,
      },
      workspaceDomain: {
        type: String,
        default: "erp.enterprise.internal",
        trim: true,
      },
      tagline: {
        type: String,
        default: "Unified Cloud Enterprise Suite for Modern Operations",
        trim: true,
      },
    },

    security: {
      twoFactorAuthPolicy: {
        type: String,
        enum: ["Enforced for Admins", "Optional", "Mandatory for All Users"],
        default: "Enforced for Admins",
      },
      sessionTimeout: {
        type: String,
        default: "24 hours",
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: 3,
        max: 10,
      },
      passwordExpiryDays: {
        type: Number,
        default: 90,
      },
      ipWhitelistEnabled: {
        type: Boolean,
        default: false,
      },
      ipWhitelist: [
        {
          type: String,
          trim: true,
        },
      ],
      apiKey: {
        type: String,
        default: "sk_live_erp_9f823a817bca492e8c892",
      },
      forcePasswordChangeOnNextLogin: {
        type: Boolean,
        default: false,
      },
    },

    notifications: {
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      dailyDigest: {
        type: Boolean,
        default: true,
      },
      maintenanceAlerts: {
        type: Boolean,
        default: true,
      },
      payrollAlerts: {
        type: Boolean,
        default: true,
      },
      slackAlerts: {
        type: Boolean,
        default: false,
      },
      slackWebhook: {
        type: String,
        default: "https://hooks.slack.com/services/T00/B00/XXXXX",
        trim: true,
      },
      digestFrequency: {
        type: String,
        enum: ["Real-time", "Hourly Digest", "Daily (9:00 AM)"],
        default: "Daily (9:00 AM)",
      },
    },

    backup: {
      autoBackup: {
        type: Boolean,
        default: true,
      },
      backupRetentionDays: {
        type: Number,
        default: 30,
      },
      backupStorageTarget: {
        type: String,
        default: "AWS S3 Glacier (ap-south-1)",
      },
      maintenanceWindow: {
        type: String,
        default: "02:00 AM - 04:00 AM UTC",
      },
      lastBackupAt: {
        type: Date,
        default: Date.now,
      },
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get singleton settings or seed defaults
systemSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne().populate("lastModifiedBy", "fullname email role");
  if (!settings) {
    settings = await this.create({
      organization: {},
      security: {
        ipWhitelist: ["127.0.0.1", "192.168.1.0/24"],
      },
      notifications: {},
      backup: {},
    });
    settings = await this.findById(settings._id).populate("lastModifiedBy", "fullname email role");
  }
  return settings;
};

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);

export default SystemSetting;
