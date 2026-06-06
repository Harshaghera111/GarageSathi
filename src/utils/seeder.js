/**
 * Demo Data Seeder — GarageSathi
 *
 * Populates Firestore with 20 customers, 30 services, and 15 invoices.
 * Includes a cleanup script to purge all seeded entries.
 * Scoped under garages/{garageId}.
 */

import {
  collection,
  doc,
  getDoc,
  writeBatch,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';

// Realistic Indian Names & Contacts
const INDIAN_NAMES = [
  'Ramesh Prasad', 'Suresh Gowda', 'Anil Kumar', 'Priya Nair', 'Amit Singh',
  'Sunita Devi', 'Vijay M', 'Karthik S', 'Santosh K', 'Kavitha R',
  'Rajesh Harsha', 'Mahesh Babu', 'Sandeep Nayak', 'Divya Prasad', 'Venkatesh Gowda',
  'Harish Kumar', 'Chetan Rao', 'Deepa Shekar', 'Anand Patil', 'Manjunath Acharya'
];

const PHONES = [
  '9845012345', '9880023456', '9900034567', '9448045678', '9740056789',
  '9632067890', '9535078901', '8095089012', '7204090123', '8884011223',
  '9945022334', '9844033445', '9980044556', '9449055667', '9739066778',
  '9611077889', '9591088990', '8123099001', '7022011002', '8971022003'
];

const VEHICLES = [
  { brand: 'Honda', model: 'Activa 6G', prefix: 'KA-01-MJ' },
  { brand: 'Bajaj', model: 'Pulsar 150', prefix: 'KA-03-HA' },
  { brand: 'TVS', model: 'Jupiter', prefix: 'KA-05-EX' },
  { brand: 'Hero', model: 'Splendor Plus', prefix: 'KA-02-KL' },
  { brand: 'Honda', model: 'Shine', prefix: 'KA-04-TR' },
  { brand: 'TVS', model: 'NTorq', prefix: 'KA-51-HG' },
  { brand: 'Royal Enfield', model: 'Classic 350', prefix: 'KA-03-NV' },
  { brand: 'Yamaha', model: 'FZ-S V3', prefix: 'KA-05-YS' },
  { brand: 'Hero', model: 'Xpulse 200', prefix: 'KA-41-QW' },
  { brand: 'KTM', model: 'Duke 200', prefix: 'KA-01-ER' },
  { brand: 'Bajaj', model: 'Platina', prefix: 'KA-04-DF' },
  { brand: 'Honda', model: 'Dio', prefix: 'KA-02-JK' },
  { brand: 'Suzuki', model: 'Access 125', prefix: 'KA-53-MN' },
  { brand: 'TVS', model: 'Apache RTR', prefix: 'KA-03-PO' },
  { brand: 'Royal Enfield', model: 'Bullet 350', prefix: 'KA-05-DF' },
  { brand: 'Yamaha', model: 'MT-15', prefix: 'KA-01-RE' },
  { brand: 'Hero', model: 'HF Deluxe', prefix: 'KA-04-OP' },
  { brand: 'Honda', model: 'Unicorn', prefix: 'KA-02-LK' },
  { brand: 'Ola', model: 'S1 Pro', prefix: 'KA-51-EV' },
  { brand: 'Ather', model: '450X', prefix: 'KA-03-EE' },
];

const SERVICE_TYPES = [
  'regular_service', 'oil_change', 'repair', 'brake', 'chain_sprocket', 'electrical'
];

const SERVICE_PROBLEMS = [
  'General service with washing, engine oil replacement, and chain adjustment.',
  'Engine oil replacement requested. Engine runs slightly hot.',
  'Rear brake pads worn out. Squeaking noise on applying brake.',
  'Chain loose and making noise. Chain sprocket kit replacement if worn.',
  'Self-start not working. Horn sound is weak. Battery check needed.',
  'Front fork oil leakage. Oil seals need replacement.',
  'Starting trouble in morning. Carburetor cleaning needed.',
  'Acceleration lag at high speed. Air filter replacement.',
  'Indicator lights not flashing. Wiring check requested.',
  'Handlebar vibrating. Wheel alignment and cone set check.'
];

const WORK_NOTES = [
  'Washed, oil changed, chain lubed and tight. Runs smooth.',
  'Engine oil replaced with Motul 10W30. Filter cleaned.',
  'Replaced rear brake shoe with OEM parts. Brake feel optimized.',
  'Chain sprocket adjusted. Tension is perfect now.',
  'Battery charged. Terminal corrosion cleaned and grease applied.',
  'Fork seals replaced. Oil changed (150ml per fork). Testing done.',
  'Carburetor cleaned and tuned. Idle set to 1400 RPM.',
  'Air filter replaced. Spark plug cleaned.',
  'Blown fuse replaced. Loose wire taped near main switch.',
  'Cone set adjusted. Air pressure checked: Front 25, Rear 32 PSI.'
];

const STATUSES = ['received', 'in_progress', 'waiting_parts', 'completed', 'delivered'];

/**
 * Seeds Firestore with 20 customers, 30 services, and 15 invoices.
 */
export async function seedDemoData(garageId) {
  if (!garageId) throw new Error('Garage ID is required for seeding.');

  const batch = writeBatch(db);

  // References
  const customersColRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS);
  const servicesColRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES);
  const invoicesColRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES);
  const counterRef = doc(db, COLLECTIONS.GARAGES, garageId, 'metadata', 'counters');

  // 1. Generate 20 Customers
  const customerDocs = [];
  for (let i = 0; i < 20; i++) {
    const custRef = doc(customersColRef);
    const vehicle = VEHICLES[i % VEHICLES.length];
    
    // Generate a unique 4 digit registration number
    const regNum = String(1000 + i * 47).slice(-4);
    const vehicleNumber = `${vehicle.prefix}-${regNum}`;

    const customerData = {
      id: custRef.id,
      name: INDIAN_NAMES[i % INDIAN_NAMES.length],
      phone: PHONES[i % PHONES.length],
      alternatePhone: '',
      address: `Bengaluru, Karnataka, India`,
      vehicles: [
        {
          vehicleNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          engineType: 'petrol',
          year: 2020 + (i % 5),
        }
      ],
      totalServices: 0,
      totalSpent: 0,
      isActive: true,
      isDemoData: true, // Flag for easy cleanup
    };

    batch.set(custRef, {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    customerDocs.push(customerData);
  }

  // 2. Generate 30 Services distributed across the 20 customers
  const serviceDocs = [];
  const timeNow = new Date();
  
  for (let i = 0; i < 30; i++) {
    const serviceRef = doc(servicesColRef);
    const customer = customerDocs[i % customerDocs.length];
    const vehicle = customer.vehicles[0];
    
    const laborCharge = 200 + (i * 25) % 600;
    const partsCharge = i % 3 === 0 ? 0 : 150 + (i * 75) % 1800;
    const estimatedCost = laborCharge + partsCharge + 100;
    const status = STATUSES[i % STATUSES.length];

    // Distribute creation dates in the last 30 days
    const createdAtDate = new Date(timeNow);
    createdAtDate.setDate(timeNow.getDate() - (i % 30));
    createdAtDate.setHours(9 + (i % 8), (i * 12) % 60);

    const serviceData = {
      id: serviceRef.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      odometer: 12000 + (i * 1234) % 40000,
      serviceType: SERVICE_TYPES[i % SERVICE_TYPES.length],
      problemDescription: SERVICE_PROBLEMS[i % SERVICE_PROBLEMS.length],
      workNotes: (status === 'completed' || status === 'delivered') ? WORK_NOTES[i % WORK_NOTES.length] : '',
      assignedMechanic: i % 2 === 0 ? 'Shankar' : 'Manju',
      laborCharge,
      partsCharge,
      estimatedCost,
      status,
      paymentStatus: (status === 'delivered') ? (i % 2 === 0 ? 'paid' : 'pending') : 'pending',
      isDemoData: true,
      createdAt: createdAtDate,
      updatedAt: createdAtDate,
    };

    batch.set(serviceRef, serviceData);
    serviceDocs.push(serviceData);

    // Update customer service count locally for seeding reference
    customer.totalServices += 1;
    customer.totalSpent += (status === 'delivered' && serviceData.paymentStatus === 'paid') 
      ? (laborCharge + partsCharge) 
      : 0;
  }

  // Update customer totals in batch
  customerDocs.forEach((c) => {
    const custRef = doc(customersColRef, c.id);
    batch.update(custRef, {
      totalServices: c.totalServices,
      totalSpent: c.totalSpent,
    });
  });

  // 3. Generate 15 Invoices linked to completed / delivered services
  const completedServices = serviceDocs.filter(
    (s) => s.status === 'completed' || s.status === 'delivered'
  );

  for (let i = 0; i < Math.min(15, completedServices.length); i++) {
    const service = completedServices[i];
    const invoiceRef = doc(invoicesColRef);
    const invoiceNumber = `INV-2026-${String(i + 1).padStart(4, '0')}`;
    const paymentStatus = service.paymentStatus; // Sync status

    const invoiceData = {
      id: invoiceRef.id,
      invoiceNumber,
      invoiceDate: new Date(service.createdAt).toISOString().split('T')[0],
      serviceId: service.id,
      customerId: service.customerId,
      customerInfo: {
        name: service.customerName,
        phone: service.customerPhone,
        address: 'Bengaluru, Karnataka, India',
      },
      vehicleInfo: {
        vehicleNumber: service.vehicleNumber,
        vehicleBrand: service.vehicleBrand,
        vehicleModel: service.vehicleModel,
        odometer: service.odometer,
      },
      laborCharge: service.laborCharge,
      partsCharge: service.partsCharge,
      subtotal: service.laborCharge + service.partsCharge,
      totalAmount: service.laborCharge + service.partsCharge,
      paymentStatus,
      notes: paymentStatus === 'paid' 
        ? 'Payment received via UPI. Thanks!' 
        : 'Payment due on vehicle pickup.',
      isDemoData: true,
      createdAt: service.createdAt,
      updatedAt: service.createdAt,
    };

    batch.set(invoiceRef, invoiceData);

    // Update service record in Firestore to reference this invoice
    const serviceRef = doc(servicesColRef, service.id);
    batch.update(serviceRef, {
      invoiceId: invoiceRef.id,
      invoiceNumber,
    });
  }

  // 4. Update counter: use max(currentCounter, 15) so we never overwrite
  // a counter that is already higher (meaning real invoices have been created).
  // Note: counterRef is already declared above at the start of this function.
  const counterSnap = await getDoc(counterRef);
  const currentCounter = counterSnap.exists() ? (counterSnap.data().invoiceCounter || 0) : 0;
  const newCounter = Math.max(currentCounter, 15);
  batch.set(counterRef, { invoiceCounter: newCounter }, { merge: true });

  await batch.commit();
}


/**
 * Deletes all demo documents created by the seeder.
 */
export async function clearDemoData(garageId) {
  if (!garageId) throw new Error('Garage ID is required for cleanup.');

  // Fetch all demo customers
  const customersRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS);
  const cSnap = await getDocs(query(customersRef, where('isDemoData', '==', true)));

  // Fetch all demo services
  const servicesRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES);
  const sSnap = await getDocs(query(servicesRef, where('isDemoData', '==', true)));

  // Fetch all demo invoices
  const invoicesRef = collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES);
  const iSnap = await getDocs(query(invoicesRef, where('isDemoData', '==', true)));

  const batch = writeBatch(db);

  cSnap.docs.forEach((doc) => batch.delete(doc.ref));
  sSnap.docs.forEach((doc) => batch.delete(doc.ref));
  iSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Counter: only reset if NO real (non-demo) invoices exist.
  // If real invoices are present, leave the counter alone to preserve
  // the sequential numbering for those invoices.
  const metaCounterRef = doc(db, COLLECTIONS.GARAGES, garageId, 'metadata', 'counters');
  const allInvoicesSnap = await getDocs(
    query(invoicesRef, where('isDemoData', '!=', true), limit(1))
  );
  if (allInvoicesSnap.empty) {
    // No real invoices exist — safe to reset counter to 0
    batch.set(metaCounterRef, { invoiceCounter: 0 }, { merge: true });
  }
  // If real invoices exist, counter is intentionally left unchanged.

  await batch.commit();
}
