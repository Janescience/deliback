import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema({
  // Company identification
  userId: {
    type: String,
    required: true,
    unique: true,
    default: 'default' // For single-tenant, can expand to multi-tenant later
  },

  // Company basic info
  companyName: {
    type: String,
    required: true,
    default: 'Ordix'
  },

  // Address information
  address: {
    line1: {
      type: String,
      default: '198 ม.9 บ้านห้วยลาดอาย ต.ขุนดินเถื่อ'
    },
    line2: {
      type: String,
      default: 'อ.ดูลำปี จ.ขกรรเขียว การค์โปรดแรด 30170'
    },
    full: {
      type: String,
      default: function() {
        return `${this.address.line1}\n${this.address.line2}`;
      }
    }
  },

  // Contact information
  telephone: {
    type: String,
    default: '(+66) 095736589'
  },

  email: {
    type: String,
    default: ''
  },

  website: {
    type: String,
    default: ''
  },

  // Tax and legal
  taxId: {
    type: String,
    default: '34090003658912'
  },

  // Logo settings
  logo: {
    url: {
      type: String,
      default: '' // Empty means use placeholder
    },
    width: {
      type: Number,
      default: 64
    },
    height: {
      type: Number,
      default: 64
    }
  },

  // Document settings
  documentSettings: {
    // Payment terms
    creditDays: {
      type: Number,
      default: 15
    },

    billingCycleDay: {
      type: Number,
      default: 15
    },

    paymentDueDays: {
      type: Number,
      default: 7
    },

    // Default notes and terms
    defaultNotes: {
      type: String,
      default: ''
    },

    paymentTermsText: {
      type: String,
      default: 'ตัดรอบวางบิลทุกวันที่ 15 ของเดือน'
    },

    paymentConditionText: {
      type: String,
      default: 'รบกวนชําระเงินภายใน 7 วันหลังจากวางบิล'
    },

    // VAT settings
    vatRate: {
      type: Number,
      default: 0 // 0% VAT as per current setup
    },

    includeVat: {
      type: Boolean,
      default: false
    }
  },

  // Bank account settings for transfer payments
  bankSettings: {
    bankName: {
      type: String,
      default: 'ธนาคารกสิกรไทย'
    },

    accountNumber: {
      type: String,
      default: '113-8-48085-9'
    },

    accountName: {
      type: String,
      default: 'นายฮาเล็ม เจะมาริกัน'
    },

    transferInstructions: {
      type: String,
      default: 'กรณีโอนชําระเงินเรียบร้อยแล้ว กรุณาส่งหลักฐานยืนยันการชําระผ่านทาง LINE'
    }
  },

  // Template customization
  templateSettings: {
    // Font settings
    fontFamily: {
      type: String,
      default: 'Sarabun'
    },

    fontSize: {
      type: String,
      default: '12px'
    },

    // Color settings
    primaryColor: {
      type: String,
      default: '#000000'
    },

    headerBackgroundColor: {
      type: String,
      default: '#ffffff'
    },

    // Document title settings
    deliveryNoteTitle: {
      thai: {
        type: String,
        default: 'ใบส่งสินค้า'
      },
      english: {
        type: String,
        default: 'Delivery Sheet'
      }
    },

    receiptTitle: {
      thai: {
        type: String,
        default: 'ใบเสร็จ'
      },
      english: {
        type: String,
        default: 'Receipt'
      }
    },

    billingTitle: {
      thai: {
        type: String,
        default: 'ใบวางบิล'
      },
      english: {
        type: String,
        default: 'Invoice'
      }
    }
  }
}, {
  timestamps: true
});

// Index for userId is already created by unique: true

// Static method to get settings for a user (with fallback to default)
companySettingsSchema.statics.getSettings = async function(userId = 'default') {
  let settings = await this.findOne({ userId });

  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({ userId });
  }

  return settings;
};

// Virtual for full address
companySettingsSchema.virtual('fullAddress').get(function() {
  return `${this.address.line1}\n${this.address.line2}`;
});

// Method to get document title by type
companySettingsSchema.methods.getDocumentTitle = function(docType) {
  const titles = this.templateSettings;

  switch(docType) {
    case 'delivery_note':
      return {
        thai: titles.deliveryNoteTitle.thai,
        english: titles.deliveryNoteTitle.english
      };
    case 'receipt':
      return {
        thai: titles.receiptTitle.thai,
        english: titles.receiptTitle.english
      };
    case 'billing':
      return {
        thai: titles.billingTitle.thai,
        english: titles.billingTitle.english
      };
    default:
      return {
        thai: 'เอกสาร',
        english: 'Document'
      };
  }
};

// Method to calculate due date
companySettingsSchema.methods.calculateDueDate = function(documentDate) {
  const date = new Date(documentDate);
  date.setDate(date.getDate() + this.documentSettings.creditDays);
  return date;
};

const CompanySettings = mongoose.models.CompanySettings || mongoose.model('CompanySettings', companySettingsSchema);

export default CompanySettings;