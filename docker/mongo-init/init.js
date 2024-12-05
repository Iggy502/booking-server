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


// Insert users with different roles
db.users.insertMany([
    {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'moderator@example.com',
        firstName: 'Moderator',
        lastName: 'User',
        phone: '+1234567891',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'host1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567892',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'host2@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1234567893',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'guest1@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        phone: '+1234567894',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: 'guest2@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1234567895',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Get user IDs for references
const adminId = db.users.findOne({email: 'admin@example.com'})._id;
const host1Id = db.users.findOne({email: 'host1@example.com'})._id;
const host2Id = db.users.findOne({email: 'host2@example.com'})._id;
const guest1Id = db.users.findOne({email: 'guest1@example.com'})._id;
const guest2Id = db.users.findOne({email: 'guest2@example.com'})._id;

// Insert sample properties
db.properties.insertMany([
    {
        name: 'Luxury Beach House',
        owner: host1Id,
        description: 'Beautiful beachfront property with amazing views',
        address: {
            street: '123 Beach Road',
            city: 'Miami',
            country: 'USA',
            postalCode: '33139'
        },
        pricePerNight: 250,
        maxGuests: 4,
        amenities: [
            {
                type: 'Pool',
                description: 'Private infinity pool overlooking the ocean'
            },
            {
                type: 'Wifi',
                description: 'High-speed fiber internet'
            },
            {
                type: 'Parking',
                description: 'Private garage',
                amount: 2
            },
            {
                type: 'Spa',
                description: 'Private jacuzzi'
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Mountain Cabin',
        owner: host1Id,
        description: 'Cozy cabin in the mountains',
        address: {
            street: '456 Mountain Trail',
            city: 'Aspen',
            country: 'USA',
            postalCode: '81611'
        },
        pricePerNight: 180,
        maxGuests: 6,
        amenities: [
            {
                type: 'Wifi',
                description: 'Satellite internet'
            },
            {
                type: 'Parking',
                description: 'Outdoor parking',
                amount: 3
            },
            {
                type: 'RoomService',
                description: 'Daily housekeeping available'
            },
            {
                type: 'PetFriendly',
                description: 'Dogs welcome'
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'City Center Apartment',
        owner: host2Id,
        description: 'Modern apartment in the heart of downtown',
        address: {
            street: '789 Main Street',
            city: 'New York',
            country: 'USA',
            postalCode: '10001'
        },
        pricePerNight: 200,
        maxGuests: 2,
        amenities: [
            {
                type: 'Wifi',
                description: 'Gigabit internet'
            },
            {
                type: 'Gym',
                description: 'Access to building gym'
            },
            {
                type: 'Restaurant',
                description: 'Ground floor restaurant'
            },
            {
                type: 'Bar',
                description: 'Rooftop bar access'
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Lakeside Villa',
        owner: host2Id,
        description: 'Spacious villa with private lake access',
        address: {
            street: '321 Lake Drive',
            city: 'Lake Tahoe',
            country: 'USA',
            postalCode: '96150'
        },
        pricePerNight: 350,
        maxGuests: 8,
        amenities: [
            {
                type: 'Pool',
                description: 'Heated outdoor pool'
            },
            {
                type: 'Wifi',
                description: 'High-speed internet'
            },
            {
                type: 'Parking',
                description: 'Large driveway',
                amount: 4
            },
            {
                type: 'Spa',
                description: 'Private spa and sauna'
            },
            {
                type: 'RoomService',
                description: 'Available 24/7'
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Desert Oasis',
        owner: host1Id,
        description: 'Unique desert property with private pool',
        address: {
            street: '555 Desert Road',
            city: 'Phoenix',
            country: 'USA',
            postalCode: '85001'
        },
        pricePerNight: 280,
        maxGuests: 4,
        amenities: [
            {
                type: 'Pool',
                description: 'Temperature-controlled pool'
            },
            {
                type: 'Wifi',
                description: 'High-speed internet'
            },
            {
                type: 'Bar',
                description: 'Private poolside bar'
            },
            {
                type: 'PetFriendly',
                description: 'Pets welcome with outdoor area'
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);
// Get property IDs
const beachHouseId = db.properties.findOne({name: 'Luxury Beach House'})._id;
const mountainCabinId = db.properties.findOne({name: 'Mountain Cabin'})._id;
const cityApartmentId = db.properties.findOne({name: 'City Center Apartment'})._id;
const lakesideVillaId = db.properties.findOne({name: 'Lakeside Villa'})._id;

// Insert sample bookings
db.bookings.insertMany([
    {
        property: beachHouseId,
        guest: guest1Id,
        checkIn: new Date('2024-12-20'),
        checkOut: new Date('2024-12-27'),
        totalPrice: 1750,
        status: 'confirmed',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        property: mountainCabinId,
        guest: guest2Id,
        checkIn: new Date('2024-12-24'),
        checkOut: new Date('2024-12-31'),
        totalPrice: 1260,
        status: 'confirmed',
        numberOfGuests: 4,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        property: cityApartmentId,
        guest: guest1Id,
        checkIn: new Date('2025-01-15'),
        checkOut: new Date('2025-01-20'),
        totalPrice: 1000,
        status: 'pending',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        property: lakesideVillaId,
        guest: guest2Id,
        checkIn: new Date('2025-02-01'),
        checkOut: new Date('2025-02-07'),
        totalPrice: 2450,
        status: 'confirmed',
        numberOfGuests: 6,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        property: beachHouseId,
        guest: guest2Id,
        checkIn: new Date('2025-03-10'),
        checkOut: new Date('2025-03-15'),
        totalPrice: 1250,
        status: 'pending',
        numberOfGuests: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

print('Database initialization completed successfully!');