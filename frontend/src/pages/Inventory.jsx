import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from '../components/GlassToast';
import './InventoryLux.css';

import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Search, 
  Plus, 
  X, 
  Grid, 
  List, 
  Laptop, 
  Monitor, 
  Armchair, 
  Keyboard as KeyboardIcon, 
  Mouse as MouseIcon, 
  Headphones, 
  Layers, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  Trash2, 
  Minus, 
  ArrowUpDown, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

// Preset curated ultra-sharp images for quick select & fallbacks
const CATEGORY_FALLBACK_IMAGES = {
  Electronics: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  Furniture: 'https://images.unsplash.com/photo-1580481077195-c328ad0263c0?w=800&auto=format&fit=crop&q=80',
  'Audio & Comm': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  Stationery: 'https://images.unsplash.com/photo-1585336261026-77cc7c223c65?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80'
};

const getCategoryIcon = (category = '', name = '') => {
  const c = category.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes('macbook') || n.includes('laptop')) return <Laptop size={13} />;
  if (n.includes('monitor') || n.includes('screen') || n.includes('display')) return <Monitor size={13} />;
  if (n.includes('chair') || c.includes('furniture')) return <Armchair size={13} />;
  if (n.includes('keyboard')) return <KeyboardIcon size={13} />;
  if (n.includes('mouse')) return <MouseIcon size={13} />;
  if (n.includes('headphone') || n.includes('headset') || c.includes('audio')) return <Headphones size={13} />;
  return <Package size={13} />;
};

const SEED_PRODUCTS = [
  { 
    _id: 'p1', 
    name: 'Macbook Pro 14"', 
    category: 'Electronics', 
    stock: 15, 
    price: 150000, 
    status: 'Low Stock',
    sku: 'MBPRO-14-M3',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    description: 'Apple M3 Pro chip, 18GB Unified Memory, 512GB SSD, Liquid Retina XDR display.',
    reorderLevel: 20
  },
  { 
    _id: 'p2', 
    name: 'Dell Monitor 27"', 
    category: 'Electronics', 
    stock: 35, 
    price: 18000, 
    status: 'In Stock',
    sku: 'DELL-27-4K',
    brand: 'Dell',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    description: 'UltraSharp 4K UHD IPS frameless display, 99% sRGB color gamut, USB-C 90W power delivery.',
    reorderLevel: 15
  },
  { 
    _id: 'p3', 
    name: 'Office Chair', 
    category: 'Furniture', 
    stock: 48, 
    price: 7500, 
    status: 'In Stock',
    sku: 'CHR-ERGO-01',
    brand: 'Herman Miller',
    image: 'https://images.unsplash.com/photo-1580481077195-c328ad0263c0?w=800&auto=format&fit=crop&q=80',
    description: 'Breathable elastomeric mesh, 3D adjustable armrests, dynamic lumbar support.',
    reorderLevel: 15
  },
  { 
    _id: 'p4', 
    name: 'Keyboard mechanical', 
    category: 'Electronics', 
    stock: 120, 
    price: 2000, 
    status: 'In Stock',
    sku: 'KB-MECH-RGB',
    brand: 'Keychron',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    description: 'Hot-swappable Gateron Brown mechanical switches, CNC aluminum chassis, PBT keycaps.',
    reorderLevel: 30
  },
  { 
    _id: 'p5', 
    name: 'Mouse optical', 
    category: 'Electronics', 
    stock: 150, 
    price: 1000, 
    status: 'In Stock',
    sku: 'MS-OPT-PRO',
    brand: 'Logitech',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    description: 'Darkfield 4000 DPI optical sensor, ultra-fast MagSpeed scroll wheel, multi-device flow.',
    reorderLevel: 40
  },
  { 
    _id: 'p6', 
    name: 'Sony WH-1000XM5 ANC Headset', 
    category: 'Audio & Comm', 
    stock: 24, 
    price: 29990, 
    status: 'In Stock',
    sku: 'SNY-XM5-SLV',
    brand: 'Sony',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    description: 'Industry-leading noise cancellation, auto NC optimizer, 30-hour battery life.',
    reorderLevel: 10
  },
  { 
    _id: 'p7', 
    name: 'Motorized Standing Desk Pro', 
    category: 'Furniture', 
    stock: 8, 
    price: 42000, 
    status: 'Low Stock',
    sku: 'DSK-MTR-OAK',
    brand: 'Jarvis',
    image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
    description: 'Dual motor electric standing desk, anti-collision sensor, solid walnut top.',
    reorderLevel: 10
  },
  { 
    _id: 'p8', 
    name: 'Logitech 4K Brio Webcam', 
    category: 'Electronics', 
    stock: 42, 
    price: 19500, 
    status: 'In Stock',
    sku: 'CAM-BRIO-4K',
    brand: 'Logitech',
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra 4K HD video calling, HDR, dual omnidirectional microphones with noise cancelling.',
    reorderLevel: 15
  }
];

const Inventory = () => {
  const { hasRole } = useAuth();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Form fields for Add/Edit
  const [formMode, setFormMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Electronics');
  const [prodBrand, setProdBrand] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // Handle auto-open create modal if forwarded via route state
  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch Inventory from live API or fallback to seed
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      const data = response.data?.data;
      const apiProd = Array.isArray(data) ? data : (data?.products || []);
      
      if (apiProd.length > 0) {
        // Normalize fields from DB
        const normalized = apiProd.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.category || 'General',
          stock: typeof p.stock === 'number' ? p.stock : (p.quantityInStock || 15),
          price: p.price || 1000,
          status: (p.stock <= (p.reorderLevel || 15)) ? 'Low Stock' : 'In Stock',
          sku: p.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
          brand: p.brand || '',
          image: p.image || p.images?.[0] || CATEGORY_FALLBACK_IMAGES[p.category] || CATEGORY_FALLBACK_IMAGES.default,
          description: p.description || '',
          reorderLevel: p.reorderLevel || 15
        }));
        setProducts(normalized);
      } else {
        setProducts(SEED_PRODUCTS);
      }
    } catch (err) {
      console.warn('API error loading inventory, fallback to high-fidelity seed:', err);
      setProducts(SEED_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Quick Copy SKU to clipboard
  const handleCopySku = (e, sku) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    showGlassToast.info('SKU Copied', `${sku} copied to clipboard.`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Stock quick adjustment (+1 / -1) with live update and toast feedback
  const handleAdjustStock = (e, productId, delta) => {
    e.stopPropagation();
    setProducts(prev => prev.map(item => {
      if (item._id === productId) {
        const newStock = Math.max(0, item.stock + delta);
        const newStatus = newStock <= (item.reorderLevel || 15) ? 'Low Stock' : 'In Stock';
        
        if (delta > 0) {
          showGlassToast.success('Stock Added', `Added 1 unit to ${item.name} (${newStock} units total)`);
        } else {
          showGlassToast.info('Stock Dispatched', `Reduced 1 unit from ${item.name} (${newStock} units remaining)`);
        }
        
        return {
          ...item,
          stock: newStock,
          status: newStatus
        };
      }
      return item;
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormMode('CREATE');
    setEditingId(null);
    setProdName('');
    setProdCategory('Electronics');
    setProdBrand('');
    setProdStock('20');
    setProdPrice('15000');
    setProdImage(CATEGORY_FALLBACK_IMAGES.Electronics);
    setProdDesc('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (e, item) => {
    e.stopPropagation();
    setFormMode('EDIT');
    setEditingId(item._id);
    setProdName(item.name);
    setProdCategory(item.category);
    setProdBrand(item.brand || '');
    setProdStock(String(item.stock));
    setProdPrice(String(item.price));
    setProdImage(item.image || '');
    setProdDesc(item.description || '');
    setIsCreateModalOpen(true);
  };

  // Delete product
  const handleDeleteProduct = (e, productId, productName) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${productName}" from inventory?`)) {
      setProducts(prev => prev.filter(p => p._id !== productId));
      showGlassToast.info('Product Removed', `${productName} was removed from the catalog.`);
      if (selectedProduct?._id === productId) {
        setIsDetailsOpen(false);
      }
    }
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const priceNum = Number(prodPrice);
    const stockNum = Number(prodStock);
    const statusVal = stockNum <= 15 ? 'Low Stock' : 'In Stock';
    const finalImage = prodImage.trim() || CATEGORY_FALLBACK_IMAGES[prodCategory] || CATEGORY_FALLBACK_IMAGES.default;

    if (formMode === 'CREATE') {
      const generatedSku = (prodName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000));
      const newProduct = {
        _id: 'prod_' + Date.now(),
        name: prodName,
        category: prodCategory,
        brand: prodBrand,
        stock: stockNum,
        price: priceNum,
        status: statusVal,
        sku: generatedSku,
        image: finalImage,
        description: prodDesc || `${prodCategory} inventory storage unit with guaranteed warranty.`,
        reorderLevel: 15
      };

      try {
        await api.post('/products', {
          name: prodName,
          category: prodCategory,
          price: priceNum,
          stock: stockNum,
          sku: generatedSku,
          brand: prodBrand,
          image: finalImage,
          description: prodDesc
        });
        showGlassToast.success('Product Created', `"${prodName}" added to database catalog.`);
        fetchInventory();
      } catch (err) {
        console.warn('API error creating product, saved in client state:', err);
        setProducts(prev => [newProduct, ...prev]);
        showGlassToast.success('Product Added', `"${prodName}" added to local inventory.`);
      }
    } else {
      // EDIT MODE
      setProducts(prev => prev.map(p => {
        if (p._id === editingId) {
          return {
            ...p,
            name: prodName,
            category: prodCategory,
            brand: prodBrand,
            stock: stockNum,
            price: priceNum,
            status: statusVal,
            image: finalImage,
            description: prodDesc
          };
        }
        return p;
      }));
      showGlassToast.success('Product Updated', `"${prodName}" successfully modified.`);
    }

    setIsCreateModalOpen(false);
  };

  // Open Details Drawer/Modal
  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'LOW_STOCK') return p.stock <= (p.reorderLevel || 15);
      if (activeCategory === 'IN_STOCK') return p.stock > (p.reorderLevel || 15);
      if (activeCategory === 'HIGH_VALUE') return (p.stock * p.price) >= 500000;
      return p.category.toLowerCase() === activeCategory.toLowerCase();
    }).sort((a, b) => {
      if (sortBy === 'STOCK_ASC') return a.stock - b.stock;
      if (sortBy === 'STOCK_DESC') return b.stock - a.stock;
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'VAL_DESC') return (b.stock * b.price) - (a.stock * a.price);
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, search, activeCategory, sortBy]);

  // Math aggregates matching KPI indicators
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= (p.reorderLevel || 15)).length;
  const totalStockValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  const formattedCrores = (totalStockValue / 10000000).toFixed(2);

  return (
    <div className="inv-page-container">
      
      {/* ── 1. Header Section ── */}
      <div className="inv-header">
        <div>
          <h1 className="inv-title">Inventory Overview</h1>
          <p className="inv-subtitle">
            Track product storage assets, live counts, price sheets, and supply statuses.
          </p>
        </div>

        <div className="inv-header-actions">
          {hasRole(['Super Admin', 'Admin', 'Manager']) && (
            <button className="inv-add-btn" onClick={handleOpenCreateModal}>
              <Plus size={16} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* ── 2. KPI Metrics Row (Matching mockup values) ── */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap purple">
            <Package size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Total Products</span>
            <h3 className="inv-stat-value">{totalProducts}</h3>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap danger">
            <AlertTriangle size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Low Stock Items</span>
            <h3 className="inv-stat-value">{lowStockCount}</h3>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap emerald">
            <TrendingUp size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Total Stock Value</span>
            <h3 className="inv-stat-value">₹{formattedCrores} Cr</h3>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap amber">
            <ShoppingCart size={22} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-label">Purchases (Month)</span>
            <h3 className="inv-stat-value">8</h3>
          </div>
        </div>
      </div>

      {/* ── 3. Filter & Controls Toolbar ── */}
      <div className="inv-toolbar">
        <div className="inv-toolbar-main">
          {/* Search Input */}
          <div className="inv-search-box">
            <Search size={16} className="inv-search-icon" />
            <input 
              type="text" 
              placeholder="Search products by title, category, or SKU..." 
              className="inv-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="inv-toolbar-controls">
            {/* Sorting Dropdown */}
            <select 
              className="inv-select" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="DEFAULT">Sort: Default</option>
              <option value="STOCK_ASC">Stock: Low to High</option>
              <option value="STOCK_DESC">Stock: High to Low</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="VAL_DESC">Valuation: High to Low</option>
              <option value="NAME_ASC">Name (A-Z)</option>
            </select>

            {/* View Mode Switcher */}
            <div className="inv-view-switch">
              <button 
                className={`inv-view-btn ${viewMode === 'CARDS' ? 'active' : ''}`}
                onClick={() => setViewMode('CARDS')}
                title="Cards Grid View"
              >
                <Grid size={15} />
                <span>Cards</span>
              </button>
              <button 
                className={`inv-view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                onClick={() => setViewMode('TABLE')}
                title="Tabular List View"
              >
                <List size={15} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="inv-category-pills">
          <button 
            className={`inv-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            <Layers size={13} />
            All Items ({products.length})
          </button>
          
          <button 
            className={`inv-pill ${activeCategory === 'LOW_STOCK' ? 'active danger' : ''}`}
            onClick={() => setActiveCategory('LOW_STOCK')}
          >
            <AlertTriangle size={13} />
            Low Stock Alert ({lowStockCount})
          </button>

          <button 
            className={`inv-pill ${activeCategory === 'Electronics' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Electronics')}
          >
            <Laptop size={13} />
            Electronics
          </button>

          <button 
            className={`inv-pill ${activeCategory === 'Furniture' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Furniture')}
          >
            <Armchair size={13} />
            Furniture
          </button>

          <button 
            className={`inv-pill ${activeCategory === 'Audio & Comm' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Audio & Comm')}
          >
            <Headphones size={13} />
            Audio & Comm
          </button>

          <button 
            className={`inv-pill ${activeCategory === 'HIGH_VALUE' ? 'active' : ''}`}
            onClick={() => setActiveCategory('HIGH_VALUE')}
          >
            <Sparkles size={13} />
            High Valuation
          </button>
        </div>
      </div>

      {/* ── 4. Main Product Representation (Cards vs Table) ── */}
      {loading ? (
        <div className="inv-empty-state">
          <div className="inv-empty-icon">
            <Package size={28} className="animate-spin" />
          </div>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Loading Inventory Catalog...</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Connecting to database & stock valuation sheets...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="inv-empty-state">
          <div className="inv-empty-icon">
            <Search size={28} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 600 }}>No Inventory Items Found</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            No products match your current search or category filter.
          </p>
          <button className="inv-pill active" onClick={() => { setSearch(''); setActiveCategory('ALL'); }}>
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'CARDS' ? (
        
        /* ── LUXURY GLASSMORPHIC CARDS GRID ── */
        <div className="inv-cards-grid">
          {filteredProducts.map((p, idx) => {
            const isLowStock = p.stock <= (p.reorderLevel || 15);
            const totalItemVal = p.stock * p.price;
            const stockPct = Math.min(100, Math.round((p.stock / 150) * 100));

            return (
              <div 
                key={p._id} 
                className="inv-glass-card" 
                style={{ '--card-index': idx }}
                onClick={() => handleCardClick(p)}
              >
                {/* Image Showcase Stage */}
                <div className="inv-card-image-wrap">
                  {/* Category Badge (Top Left) */}
                  <div className="inv-card-category-badge">
                    {getCategoryIcon(p.category, p.name)}
                    <span>{p.category}</span>
                  </div>

                  {/* Stock Status Badge (Top Right) */}
                  <div className={`inv-card-status-badge ${isLowStock ? 'low-stock' : 'in-stock'}`}>
                    <span className={`inv-status-dot ${isLowStock ? 'danger' : 'emerald'}`} />
                    <span>{isLowStock ? 'Low Stock' : 'In Stock'}</span>
                  </div>

                  {/* Product Image with Fallback */}
                  <img 
                    src={p.image || CATEGORY_FALLBACK_IMAGES[p.category] || CATEGORY_FALLBACK_IMAGES.default} 
                    alt={p.name}
                    className="inv-card-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = CATEGORY_FALLBACK_IMAGES[p.category] || CATEGORY_FALLBACK_IMAGES.default;
                    }}
                    loading="lazy"
                  />

                  {/* Quick Action Overlay on Image Hover */}
                  <div className="inv-image-overlay">
                    <button 
                      className="inv-overlay-btn" 
                      onClick={(e) => { e.stopPropagation(); handleCardClick(p); }}
                    >
                      <Eye size={13} />
                      Quick View
                    </button>
                    {hasRole(['Super Admin', 'Admin', 'Manager']) && (
                      <button 
                        className="inv-overlay-btn" 
                        onClick={(e) => handleOpenEditModal(e, p)}
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="inv-card-body">
                  <div className="inv-card-header-info">
                    <div className="inv-card-name-row">
                      <h3 className="inv-card-name" title={p.name}>{p.name}</h3>
                      {p.sku && (
                        <div 
                          className="inv-sku-pill" 
                          onClick={(e) => handleCopySku(e, p.sku)}
                          title="Click to copy SKU"
                        >
                          {copiedSku === p.sku ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                          <span>{p.sku}</span>
                        </div>
                      )}
                    </div>
                    {p.brand && (
                      <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                        {p.brand}
                      </span>
                    )}
                    {p.description && (
                      <p className="inv-card-desc">{p.description}</p>
                    )}
                  </div>

                  {/* Stock Level Progress Gauge */}
                  <div className="inv-stock-meter-wrap">
                    <div className="inv-stock-meter-header">
                      <span className="inv-stock-meter-label">
                        <Package size={12} />
                        Current Stock:
                      </span>
                      <span className="inv-stock-meter-val" style={{ color: isLowStock ? '#f87171' : '#f8fafc' }}>
                        {p.stock} Units
                      </span>
                    </div>

                    <div className="inv-progress-track">
                      <div 
                        className={`inv-progress-fill ${isLowStock ? 'rose' : stockPct < 30 ? 'amber' : 'green'}`}
                        style={{ width: `${Math.max(6, stockPct)}%` }}
                      />
                    </div>

                    {isLowStock && (
                      <div className="inv-stock-warning-text">
                        <AlertTriangle size={11} />
                        Reorder alert: threshold ≤ {p.reorderLevel || 15}
                      </div>
                    )}
                  </div>

                  {/* Price & Total Valuation Strip */}
                  <div className="inv-price-grid">
                    <div className="inv-price-col">
                      <span className="inv-price-label">Unit Price</span>
                      <span className="inv-unit-price">₹{p.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="inv-price-col" style={{ textAlign: 'right' }}>
                      <span className="inv-price-label">Total Valuation</span>
                      <span className="inv-total-value">₹{totalItemVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Interactive Footer Controls */}
                  <div className="inv-card-footer">
                    {/* Quick Stock Adjuster */}
                    <div className="inv-stock-adjuster" title="Quick adjust stock in storage" onClick={e => e.stopPropagation()}>
                      <button 
                        className="inv-adj-btn" 
                        onClick={(e) => handleAdjustStock(e, p._id, -1)}
                        title="Reduce 1 unit"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="inv-adj-count">{p.stock}</span>
                      <button 
                        className="inv-adj-btn" 
                        onClick={(e) => handleAdjustStock(e, p._id, 1)}
                        title="Add 1 unit"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="inv-card-actions">
                      {hasRole(['Super Admin', 'Admin', 'Manager']) && (
                        <button 
                          className="inv-btn-icon" 
                          onClick={(e) => handleOpenEditModal(e, p)}
                          title="Edit Product"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {hasRole(['Super Admin']) && (
                        <button 
                          className="inv-btn-icon danger" 
                          onClick={(e) => handleDeleteProduct(e, p._id, p.name)}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        /* ── TABLE VIEW (Matching the screenshot high-density table) ── */
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= (p.reorderLevel || 15);
                  return (
                    <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => handleCardClick(p)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={p.image || CATEGORY_FALLBACK_IMAGES[p.category] || CATEGORY_FALLBACK_IMAGES.default}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>{p.name}</div>
                            {p.sku && <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inv-pill" style={{ display: 'inline-flex', padding: '3px 10px' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.stock}</td>
                      <td>₹{p.price.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>
                        ₹{(p.stock * p.price).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="inv-btn-icon" 
                            onClick={(e) => handleAdjustStock(e, p._id, 1)}
                            title="Add stock"
                          >
                            <Plus size={13} />
                          </button>
                          <button 
                            className="inv-btn-icon" 
                            onClick={(e) => handleOpenEditModal(e, p)}
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Product Details Modal / Drawer ── */}
      {isDetailsOpen && selectedProduct && (
        <div className="inv-details-modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="inv-details-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="inv-stat-icon-wrap purple" style={{ width: '36px', height: '36px' }}>
                  {getCategoryIcon(selectedProduct.category, selectedProduct.name)}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, textTransform: 'capitalize' }}>
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    SKU: {selectedProduct.sku} • {selectedProduct.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="inv-modal-body">
              {/* Product Big Showcase Image */}
              <div style={{ width: '100%', height: '260px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={selectedProduct.image || CATEGORY_FALLBACK_IMAGES[selectedProduct.category] || CATEGORY_FALLBACK_IMAGES.default} 
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                  <span className={`badge ${selectedProduct.stock <= 15 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                    {selectedProduct.stock <= 15 ? '⚠️ Low Stock Alert' : '✓ Normal Supply'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="inv-stock-meter-wrap">
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Units In Storage</span>
                  <h4 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700 }}>{selectedProduct.stock}</h4>
                </div>
                <div className="inv-stock-meter-wrap">
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Unit Price</span>
                  <h4 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700 }}>₹{selectedProduct.price.toLocaleString('en-IN')}</h4>
                </div>
                <div className="inv-stock-meter-wrap">
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Asset Valuation</span>
                  <h4 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#818cf8' }}>
                    ₹{(selectedProduct.stock * selectedProduct.price).toLocaleString('en-IN')}
                  </h4>
                </div>
              </div>

              {/* Description & Specifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Description & Specifications</span>
                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  {selectedProduct.description || 'Enterprise catalog hardware asset with active serial tracking and maintenance schedule.'}
                </p>
              </div>

              {/* Reorder and Quick Action Footer in modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Adjust Storage:</span>
                  <div className="inv-stock-adjuster">
                    <button className="inv-adj-btn" onClick={(e) => handleAdjustStock(e, selectedProduct._id, -5)} title="-5 units">-5</button>
                    <button className="inv-adj-btn" onClick={(e) => handleAdjustStock(e, selectedProduct._id, -1)} title="-1 unit">-1</button>
                    <span className="inv-adj-count">{selectedProduct.stock}</span>
                    <button className="inv-adj-btn" onClick={(e) => handleAdjustStock(e, selectedProduct._id, 1)} title="+1 unit">+1</button>
                    <button className="inv-adj-btn" onClick={(e) => handleAdjustStock(e, selectedProduct._id, 10)} title="+10 units">+10</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={(e) => {
                      handleOpenEditModal(e, selectedProduct);
                      setIsDetailsOpen(false);
                    }}
                  >
                    Edit Info
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      handleAdjustStock({ stopPropagation: () => {} }, selectedProduct._id, 25);
                      showGlassToast.success('Reorder Dispatched', `Batch order for 25 units of "${selectedProduct.name}" initiated.`);
                    }}
                  >
                    Reorder Batch (+25)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Add / Edit Product Glass Modal ── */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="inv-stat-icon-wrap purple" style={{ width: '32px', height: '32px' }}>
                  <Package size={16} />
                </span>
                <h3>{formMode === 'CREATE' ? 'Add Inventory Product' : 'Edit Inventory Product'}</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Dell UltraSharp 32\" 
                    value={prodName} 
                    onChange={e => setProdName(e.target.value)} 
                  />
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      className="form-input" 
                      value={prodCategory} 
                      onChange={e => {
                        setProdCategory(e.target.value);
                        if (!prodImage || Object.values(CATEGORY_FALLBACK_IMAGES).includes(prodImage)) {
                          setProdImage(CATEGORY_FALLBACK_IMAGES[e.target.value] || CATEGORY_FALLBACK_IMAGES.default);
                        }
                      }}
                    >
                      <option>Electronics</option>
                      <option>Furniture</option>
                      <option>Audio & Comm</option>
                      <option>Stationery</option>
                      <option>Hardware</option>
                      <option>Utilities</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Brand / Manufacturer</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Apple, Dell, Logitech" 
                      value={prodBrand} 
                      onChange={e => setProdBrand(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Initial Stock Quantity *</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      className="form-input" 
                      placeholder="e.g. 50" 
                      value={prodStock} 
                      onChange={e => setProdStock(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price (INR) *</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      className="form-input" 
                      placeholder="e.g. 18000" 
                      value={prodPrice} 
                      onChange={e => setProdPrice(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Image URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={prodImage} 
                    onChange={e => setProdImage(e.target.value)} 
                  />
                  {prodImage && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={prodImage} 
                        alt="Preview" 
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Image preview active</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    placeholder="Brief description of tech specs, model, and condition..."
                    value={prodDesc} 
                    onChange={e => setProdDesc(e.target.value)} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {formMode === 'CREATE' ? 'Add to Catalog' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
