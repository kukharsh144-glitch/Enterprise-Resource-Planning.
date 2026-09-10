import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './src/models/Product.model.js';
import Inventory from './src/models/Inventory.model.js';
import User from './src/models/User.model.js';

async function seed() {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/ERP`);
    console.log('Connected to MongoDB ERP database');

    const admin = await User.findOne({ email: 'harsh@company.com' });
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    const seedItems = [
      {
        name: 'Macbook Pro 14"',
        category: 'Electronics',
        sku: 'MBPRO-14-M3',
        price: 150000,
        stock: 15,
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        description: 'Apple M3 Pro chip, 18GB Unified Memory, 512GB SSD, Liquid Retina XDR display.',
        reorderLevel: 20
      },
      {
        name: 'Dell Monitor 27"',
        category: 'Electronics',
        sku: 'DELL-27-4K',
        price: 18000,
        stock: 35,
        brand: 'Dell',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
        description: 'UltraSharp 4K UHD IPS frameless display, 99% sRGB color gamut, USB-C 90W power delivery.',
        reorderLevel: 15
      },
      {
        name: 'Office Chair',
        category: 'Furniture',
        sku: 'CHR-ERGO-01',
        price: 7500,
        stock: 48,
        brand: 'Herman Miller',
        image: 'https://images.unsplash.com/photo-1580481077195-c328ad0263c0?w=800&auto=format&fit=crop&q=80',
        description: 'Breathable elastomeric mesh, 3D adjustable armrests, dynamic lumbar support.',
        reorderLevel: 15
      },
      {
        name: 'Keyboard mechanical',
        category: 'Electronics',
        sku: 'KB-MECH-RGB',
        price: 2000,
        stock: 120,
        brand: 'Keychron',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        description: 'Hot-swappable Gateron Brown mechanical switches, CNC aluminum chassis, PBT keycaps.',
        reorderLevel: 30
      },
      {
        name: 'Mouse optical',
        category: 'Electronics',
        sku: 'MS-OPT-PRO',
        price: 1000,
        stock: 150,
        brand: 'Logitech',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
        description: 'Darkfield 4000 DPI optical sensor, ultra-fast MagSpeed scroll wheel, multi-device flow.',
        reorderLevel: 40
      },
      {
        name: 'Sony WH-1000XM5 ANC Headset',
        category: 'Electronics',
        sku: 'SNY-XM5-SLV',
        price: 29990,
        stock: 24,
        brand: 'Sony',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        description: 'Industry-leading noise cancellation, auto NC optimizer, 30-hour battery life.',
        reorderLevel: 10
      },
      {
        name: 'Motorized Standing Desk Pro',
        category: 'Furniture',
        sku: 'DSK-MTR-OAK',
        price: 42000,
        stock: 8,
        brand: 'Jarvis',
        image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
        description: 'Dual motor electric standing desk, anti-collision sensor, solid walnut top.',
        reorderLevel: 10
      },
      {
        name: 'Logitech 4K Brio Webcam',
        category: 'Electronics',
        sku: 'CAM-BRIO-4K',
        price: 19500,
        stock: 42,
        brand: 'Logitech',
        image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&auto=format&fit=crop&q=80',
        description: 'Ultra 4K HD video calling, HDR, dual omnidirectional microphones with noise cancelling.',
        reorderLevel: 15
      }
    ];

    for (const item of seedItems) {
      let p = await Product.findOne({ sku: item.sku });
      if (!p) {
        p = await Product.create({
          name: item.name,
          category: item.category,
          sku: item.sku,
          price: item.price,
          description: item.description,
          brand: item.brand,
          image: item.image,
          images: [item.image],
          reorderLevel: item.reorderLevel,
          isActive: true,
          createdBy: adminId
        });
        console.log('Created product:', p.name, p.sku);
      } else {
        p.image = item.image;
        p.images = [item.image];
        p.description = item.description;
        p.price = item.price;
        p.isActive = true;
        await p.save();
        console.log('Updated existing product:', p.name, p.sku);
      }

      let inv = await Inventory.findOne({ product: p._id });
      if (!inv) {
        await Inventory.create({
          product: p._id,
          warehouse: 'Main Warehouse',
          quantityInStock: item.stock,
          reorderLevel: item.reorderLevel
        });
        console.log('Created inventory record for:', p.name, 'Stock:', item.stock);
      } else {
        inv.quantityInStock = item.stock;
        await inv.save();
      }
    }

    console.log('Inventory seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
