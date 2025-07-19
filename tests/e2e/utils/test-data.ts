export const testUsers = {
  newUser: {
    email: 'test-new-user@csl.test',
    password: 'TestPassword123!',
    name: 'Test New User'
  },
  existingUser: {
    email: 'test-existing@csl.test',
    password: 'TestPassword123!',
    name: 'Test Existing User'
  },
  adminUser: {
    email: 'admin@csl.test',
    password: 'AdminPassword123!',
    name: 'Test Admin User'
  }
};

export const testAudio = {
  sampleFiles: [
    '3bamboos.mp4',
    'flute.mp4',
    'pullstring.mp4',
    'rawflutes.mp4',
    'strings.mp4'
  ],
  generationTypes: {
    soundLogo: {
      duration: 5,
      style: 'modern',
      mood: 'energetic'
    },
    playlist: {
      duration: 30,
      trackCount: 5,
      mood: 'ambient'
    },
    socialClip: {
      duration: 15,
      platform: 'instagram',
      mood: 'upbeat'
    },
    longForm: {
      duration: 120,
      style: 'atmospheric',
      mood: 'contemplative'
    }
  }
};

export const paymentData = {
  validCard: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    name: 'Test User'
  },
  declinedCard: {
    number: '4000000000000002',
    expiry: '12/30',
    cvc: '123',
    name: 'Test User'
  }
};

export const licenseTypes = {
  personal: {
    name: 'Personal',
    price: 0,
    features: ['Personal use only', 'Download rights']
  },
  commercial: {
    name: 'Commercial',
    price: 29,
    features: ['Commercial use', 'Download rights', 'Attribution required']
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    features: ['Commercial use', 'Download rights', 'No attribution required', 'Priority support']
  }
};