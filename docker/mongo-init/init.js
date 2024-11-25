db = db.getSiblingDB('booking_db');

// Create collections
db.createCollection('users');
db.createCollection('properties');
db.createCollection('bookings');

// Create indexes
db.users.createIndex({email: 1}, {unique: true});
db.properties.createIndex({owner: 1});
db.bookings.createIndex({property: 1, checkIn: 1, checkOut: 1});
db.bookings.createIndex({guest: 1});

// Insert sample data
db.users.insertMany([
    {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1987654321',
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Get user IDs for references
const johnId = db.users.findOne({email: 'john@example.com'})._id;
const janeId = db.users.findOne({email: 'jane@example.com'})._id;

// Insert sample properties
db.properties.insertMany([
    {
        name: 'Luxury Beach House',
        owner: johnId,
        description: 'Beautiful beachfront property with amazing views',
        address: {
            street: '123 Beach Road',
            city: 'Miami',
            country: 'USA',
            postalCode: '33139'
        },
        pricePerNight: 250,
        maxGuests: 4,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Mountain Cabin',
        owner: janeId,
        description: 'Cozy cabin in the mountains',
        address: {
            street: '456 Mountain Trail',
            city: 'Aspen',
            country: 'USA',
            postalCode: '81611'
        },
        pricePerNight: 180,
        maxGuests: 6,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Get property ID for reference
const propertyId = db.properties.findOne({name: 'Luxury Beach House'})._id;


// Insert sample booking
db.bookings.insertOne({
    property: propertyId,
    guest: janeId,
    checkIn: new Date('2024-12-20'),
    checkOut: new Date('2024-12-27'),
    totalPrice: 1750,
    status: 'confirmed',
    numberOfGuests: 2,
    createdAt: new Date(),
    updatedAt: new Date()
});