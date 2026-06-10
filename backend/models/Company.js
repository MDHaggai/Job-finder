const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters'],
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    maxlength: [2000, 'Company description cannot be more than 2000 characters']
  },
  logo: {
    type: String,
    default: null
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid website URL'
    }
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'technology',
      'healthcare',
      'finance',
      'education',
      'retail',
      'manufacturing',
      'consulting',
      'media',
      'transportation',
      'energy',
      'real-estate',
      'hospitality',
      'agriculture',
      'government',
      'non-profit',
      'other'
    ]
  },
  size: {
    type: String,
    required: [true, 'Company size is required'],
    enum: [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+'
    ]
  },
  founded: {
    type: Number,
    min: [1800, 'Founded year must be after 1800'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  headquarters: {
    address: String,
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: String,
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: String
  },
  locations: [{
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    isHeadquarters: {
      type: Boolean,
      default: false
    }
  }],
  contactInfo: {
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: String,
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  culture: {
    values: [String],
    mission: String,
    vision: String,
    workEnvironment: {
      type: String,
      enum: ['remote', 'hybrid', 'on-site', 'flexible']
    },
    benefits: [{
      type: String,
      enum: [
        'health-insurance',
        'dental-insurance',
        'vision-insurance',
        'retirement-plan',
        'paid-time-off',
        'flexible-schedule',
        'remote-work',
        'professional-development',
        'tuition-reimbursement',
        'gym-membership',
        'commuter-benefits',
        'life-insurance',
        'disability-insurance',
        'employee-discounts',
        'stock-options',
        'bonus-eligible',
        'maternity-leave',
        'paternity-leave',
        'wellness-programs',
        'free-meals',
        'other'
      ]
    }],
    perks: [String]
  },
  ratings: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    workLifeBalance: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    compensation: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    culture: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    careerGrowth: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    management: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyReview'
  }],
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  employees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'employee'],
      default: 'employee'
    },
    department: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  financials: {
    revenue: String,
    funding: String,
    investors: [String]
  },
  media: {
    photos: [String],
    videos: [String]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
companySchema.virtual('employeeCount').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Virtual for job count
companySchema.virtual('jobCount').get(function() {
  return this.jobs ? this.jobs.length : 0;
});

// Virtual for follower count
companySchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Pre-save middleware to generate slug
companySchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Method to calculate average rating
companySchema.methods.calculateAverageRating = function() {
  const ratings = this.ratings;
  const ratingValues = [
    ratings.workLifeBalance,
    ratings.compensation,
    ratings.culture,
    ratings.careerGrowth,
    ratings.management
  ].filter(rating => rating > 0);

  if (ratingValues.length === 0) {
    this.ratings.overall = 0;
  } else {
    this.ratings.overall = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
  }
  
  return this.ratings.overall;
};

// Method to add employee
companySchema.methods.addEmployee = function(userId, role = 'employee', department) {
  const existingEmployee = this.employees.find(emp => emp.user.toString() === userId.toString());
  
  if (!existingEmployee) {
    this.employees.push({
      user: userId,
      role,
      department
    });
  }
  
  return this.save();
};

// Method to remove employee
companySchema.methods.removeEmployee = function(userId) {
  this.employees = this.employees.filter(emp => emp.user.toString() !== userId.toString());
  return this.save();
};

// Static method to find by industry
companySchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: new RegExp(industry, 'i') });
};

// Static method to find by size
companySchema.statics.findBySize = function(size) {
  return this.find({ size });
};

// Index for better performance
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ size: 1 });
companySchema.index({ 'headquarters.city': 1, 'headquarters.state': 1, 'headquarters.country': 1 });
companySchema.index({ isVerified: 1 });
companySchema.index({ status: 1 });
companySchema.index({ 'ratings.overall': -1 });
companySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Company', companySchema);
