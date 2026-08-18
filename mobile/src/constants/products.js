export const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🛍️' },
  { value: 'seeds', label: 'Seeds', emoji: '🌱' },
  { value: 'fertilizers', label: 'Fertilizers', emoji: '🧪' },
  { value: 'pesticides', label: 'Pesticides', emoji: '🐛' },
  { value: 'tools', label: 'Tools', emoji: '🔧' },
  { value: 'irrigation', label: 'Irrigation', emoji: '💧' },
];

// TODO: replace with a real product catalog from the backend.
export const PRODUCTS = [
  // Seeds
  { id: 's1', name: 'Hybrid Paddy Seeds', category: 'seeds', emoji: '🌾', price: 850, mrp: 1000, rating: 4.3, ratingCount: 210, unit: '5 kg pack' },
  { id: 's2', name: 'Cotton BT Seeds', category: 'seeds', emoji: '🌱', price: 720, mrp: 850, rating: 4.1, ratingCount: 95, unit: '450 g packet' },
  { id: 's3', name: 'Tomato Hybrid Seeds', category: 'seeds', emoji: '🍅', price: 180, mrp: 220, rating: 4.5, ratingCount: 340, unit: '10 g pack' },
  { id: 's4', name: 'Maize Seeds', category: 'seeds', emoji: '🌽', price: 1450, mrp: 1650, rating: 4.2, ratingCount: 120, unit: '10 kg bag' },

  // Fertilizers
  { id: 'f1', name: 'Urea', category: 'fertilizers', emoji: '🧪', price: 266, mrp: 300, rating: 4.4, ratingCount: 512, unit: '45 kg bag' },
  { id: 'f2', name: 'DAP Fertilizer', category: 'fertilizers', emoji: '🧴', price: 1350, mrp: 1500, rating: 4.3, ratingCount: 289, unit: '50 kg bag' },
  { id: 'f3', name: 'NPK 19:19:19', category: 'fertilizers', emoji: '🧪', price: 950, mrp: 1100, rating: 4.2, ratingCount: 156, unit: '25 kg bag' },
  { id: 'f4', name: 'Vermicompost', category: 'fertilizers', emoji: '🪱', price: 240, mrp: 300, rating: 4.6, ratingCount: 402, unit: '10 kg bag' },

  // Pesticides
  { id: 'p1', name: 'Neem Oil Spray', category: 'pesticides', emoji: '🌿', price: 320, mrp: 400, rating: 4.4, ratingCount: 178, unit: '1 L bottle' },
  { id: 'p2', name: 'Chlorpyrifos 20% EC', category: 'pesticides', emoji: '🧴', price: 280, mrp: 340, rating: 4.0, ratingCount: 88, unit: '500 ml' },
  { id: 'p3', name: 'Mancozeb Fungicide', category: 'pesticides', emoji: '🍄', price: 410, mrp: 480, rating: 4.1, ratingCount: 132, unit: '1 kg pack' },
  { id: 'p4', name: 'Sticky Traps', category: 'pesticides', emoji: '🪤', price: 150, mrp: 200, rating: 4.5, ratingCount: 245, unit: 'pack of 10' },

  // Tools
  { id: 't1', name: 'Manual Knapsack Sprayer', category: 'tools', emoji: '🎒', price: 1200, mrp: 1500, rating: 4.3, ratingCount: 310, unit: '16 L' },
  { id: 't2', name: 'Garden Hoe', category: 'tools', emoji: '🛠️', price: 380, mrp: 450, rating: 4.2, ratingCount: 145, unit: 'piece' },
  { id: 't3', name: 'Pruning Shears', category: 'tools', emoji: '✂️', price: 250, mrp: 320, rating: 4.4, ratingCount: 267, unit: 'piece' },
  { id: 't4', name: 'Solar Pest Light Trap', category: 'tools', emoji: '💡', price: 1850, mrp: 2200, rating: 4.1, ratingCount: 76, unit: 'piece' },

  // Irrigation
  { id: 'i1', name: 'Drip Irrigation Kit', category: 'irrigation', emoji: '💧', price: 4500, mrp: 5500, rating: 4.5, ratingCount: 198, unit: '1 acre kit' },
  { id: 'i2', name: 'Sprinkler Set', category: 'irrigation', emoji: '🚿', price: 1350, mrp: 1600, rating: 4.2, ratingCount: 112, unit: 'pack of 5' },
  { id: 'i3', name: 'Water Pump', category: 'irrigation', emoji: '⚙️', price: 3200, mrp: 3800, rating: 4.3, ratingCount: 90, unit: '1 HP' },
  { id: 'i4', name: 'Mini Sprinkler Kit', category: 'irrigation', emoji: '💦', price: 950, mrp: 1150, rating: 4.1, ratingCount: 134, unit: 'kit' },
];
