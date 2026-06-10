const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['candidate', 'employer', 'admin'],
    default: 'candidate'
  },
  profilePicture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  frontendSkills: [{
    type: String,
    trim: true
  }],
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  resume: {
    type: String,
    default: null
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  followedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  // New fields from frontend
  currentRole: {
    type: String,
    trim: true
  },
  experienceYears: {
    type: String,
    trim: true
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  currentCompany: {
    type: String,
    trim: true
  },
  // Reference to Company for employers
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  // User location (separate from preferences location)
  userLocation: {
    country: {
      isoCode: String,
      name: String,
      flag: String
    },
    state: {
      isoCode: String,
      name: String
    },
    city: {
      name: String,
      latitude: Number,
      longitude: Number
    }
  },
  preferences: {
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      default: 'full-time'
    },
    // New fields from frontend
    jobSearchStatus: {
      type: String,
      enum: ['ready-to-interview', 'open-to-offers', 'closed-to-offers'],
      trim: true
    },
    jobTypes: [{
      type: String,
      enum: ['full-time', 'contractor', 'intern', 'co-founder'],
      trim: true
    }],
    desiredSalary: {
      type: Number
    },
    salaryPeriod: {
      type: String,
      enum: ['yearly', 'monthly', 'hourly'],
      default: 'yearly'
    },
    rolesLookingFor: [{
      type: String,
      trim: true
    }],
    salaryRange: {
      min: Number,
      max: Number
    },
    location: {
      country: {
        isoCode: String,
        name: String,
        flag: String
      },
      state: {
        isoCode: String,
        name: String
      },
      city: {
        name: String,
        latitude: Number,
        longitude: Number
      },
      remote: {
        type: Boolean,
        default: false
      }
    },
    industries: [String],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      jobAlerts: {
        type: Boolean,
        default: true
      },
      companyUpdates: {
        type: Boolean,
        default: true
      }
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};

// Index for better performance
userSchema.index({ 'location.city': 1, 'location.state': 1 });
userSchema.index({ skills: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
