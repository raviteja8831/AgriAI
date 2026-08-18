import React, { useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { colors } from '../utils/theme';
import { useSnackbar } from '../components/SnackbarProvider';
import { PRODUCTS, CATEGORIES } from '../constants/products';
import ProductCard from '../components/ProductCard';
import PromoBannerCarousel from '../components/PromoBannerCarousel';

const PILLS = [
  { key: 'offers', label: '🎁 Offers' },
  { key: 'coins', label: '🪙 Coins' },
  { key: 'delivery', label: '🚚 Fast Delivery' },
  { key: 'verified', label: '✅ Verified Sellers' },
];

const BANNERS = [
  { emoji: '🌾', title: 'Kharif Season Sale', subtitle: 'Up to 25% off on seeds & fertilizers', bg: colors.primary },
  { emoji: '💧', title: 'Irrigation Bonanza', subtitle: 'Drip kits starting ₹4,500', bg: colors.info },
  { emoji: '🎁', title: 'New Farmer Offer', subtitle: 'Flat ₹100 off on your first order', bg: '#7b1fa2' },
];

export default function ShopScreen({ navigation }) {
  const snack = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState({});

  const cartCount = Object.keys(cart).length;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => snack.showSuccess(cartCount > 0 ? `${cartCount} item(s) in cart — checkout coming soon` : 'Your cart is empty')}
          style={styles.cartButton}
        >
          <Text style={{ fontSize: 20 }}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, cartCount]);

  const toggleAdd = (product) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = true;
        snack.showSuccess(`${product.name} added to cart`);
      }
      return next;
    });
  };

  const handlePillPress = (key) => {
    if (key === 'offers') navigation.navigate('HomeTab', { screen: 'Cashback' });
    else if (key === 'coins') navigation.navigate('HomeTab', { screen: 'Coins' });
    else snack.showSuccess('Coming soon');
  };

  const filtered = PRODUCTS.filter((p) => {
    const matchesCategory = category === 'all' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Search + promo pills */}
      <View style={styles.searchZone}>
        <Searchbar
          placeholder="Search seeds, fertilizers, tools..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
          icon="magnify"
          iconColor={colors.textSecondary}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {PILLS.map((pill) => (
            <TouchableOpacity key={pill.key} style={styles.pill} onPress={() => handlePillPress(pill.key)}>
              <Text style={styles.pillText}>{pill.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((c) => {
          const active = category === c.value;
          return (
            <TouchableOpacity key={c.value} style={styles.categoryItem} onPress={() => setCategory(c.value)}>
              <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
              </View>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Banner carousel */}
      <PromoBannerCarousel banners={BANNERS} />

      {/* Product grid */}
      <Text style={styles.sectionTitle}>
        {category === 'all' ? 'All Products' : CATEGORIES.find((c) => c.value === category)?.label}
      </Text>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} added={!!cart[product.id]} onToggleAdd={toggleAdd} />
          ))}
        </View>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 14 },
  cartButton: { paddingHorizontal: 16, position: 'relative' },
  cartBadge: { position: 'absolute', top: 2, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.primary },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchZone: { backgroundColor: colors.primary, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 14 },
  searchbar: { borderRadius: 24, elevation: 0, marginBottom: 10 },
  searchbarInput: { fontSize: 14, minHeight: 0 },
  pillsRow: { gap: 8 },
  pill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  categoryRow: { paddingHorizontal: 14, paddingVertical: 14, gap: 18 },
  categoryItem: { alignItems: 'center', width: 64 },
  categoryIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  categoryIconActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' },
  categoryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  categoryLabelActive: { color: colors.primary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginHorizontal: 14, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 14, gap: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
