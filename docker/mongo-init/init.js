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
        updatedAt: new Date(),
        profilePicturePath: 'profiles/test/eric-cartman.png'
    },
    {
        email: 'joske@example.com',
        firstName: 'Moderator',
        lastName: 'User',
        phone: '+1234567891',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicturePath: 'profiles/test/Original_Doge_meme.jpg'

    },
    {
        email: 'host1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567892',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicturePath: 'https://media.tenor.com/miBvHR4Q68wAAAAe/dick-dickbutt.png'

    },
    {
        email: 'host2@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1234567893',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicturePath: 'https://media.tenor.com/miBvHR4Q68wAAAAe/dick-dickbutt.png'

    },
    {
        email: 'guest1@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        phone: '+1234567894',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicturePath: 'https://media.tenor.com/miBvHR4Q68wAAAAe/dick-dickbutt.png'
    },
    {
        email: 'guest2@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1234567895',
        password: 'test',
        roles: ['TEST'],
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePicturePath: 'https://media.tenor.com/miBvHR4Q68wAAAAe/dick-dickbutt.png'
    }
]);

// Get user IDs for references
const adminId = db.users.findOne({email: 'admin@example.com'})._id;
const joske = db.users.findOne({email: 'joske@example.com'})._id;
const host2Id = db.users.findOne({email: 'host2@example.com'})._id;
const guest1Id = db.users.findOne({email: 'guest1@example.com'})._id;
const guest2Id = db.users.findOne({email: 'guest2@example.com'})._id;

db.properties.insertMany([
    {
        name: 'Luxury Canal House',
        owner: adminId,
        description: 'Beautiful canalside property in historic Bruges',
        address: {
            street: 'Dijver 12',
            city: 'Bruges',
            country: 'Belgium',
            postalCode: '8000',
            latitude: 51.2067,
            longitude: 3.2246
        },
        pricePerNight: 250,
        maxGuests: 4,
        amenities: [
            {
                type: 'Parking',
                description: 'Outdoor parking',
                amount: 3
            }
        ],
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imagePaths: [
            'properties/test/testpropimage1.webp',
            'properties/test/testpropimage2.webp',
            'properties/test/testpropimage3.webp'
        ]
    },
    {
        name: 'Ardennes Cabin',
        owner: adminId,
        description: 'Cozy cabin in the Belgian Ardennes',
        address: {
            street: 'Rue de la Forêt 45',
            city: 'La Roche-en-Ardenne',
            country: 'Belgium',
            postalCode: '6980',
            latitude: 50.1827,
            longitude: 5.5766
        },
        pricePerNight: 180,
        maxGuests: 6,
        amenities: [
            {
                type: 'Parking',
                description: 'Outdoor parking',
                amount: 3
            }
        ],
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imagePaths: [
            'properties/test/testpropimage1.webp',
            'properties/test/testpropimage2.webp',
            'properties/test/testpropimage3.webp'
        ]
    },
    {
        name: 'Brussels City Apartment',
        owner: adminId,
        description: 'Modern apartment near Grand Place',
        address: {
            street: 'Rue du Marché aux Herbes 78',
            city: 'Brussels',
            country: 'Belgium',
            postalCode: '1000',
            latitude: 50.8468,
            longitude: 4.3525
        },
        pricePerNight: 200,
        maxGuests: 2,
        amenities: [
            {
                type: 'Parking',
                description: 'Outdoor parking',
                amount: 3
            }
        ],
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imagePaths: [
            'properties/test/testpropimage1.webp',
            'properties/test/testpropimage2.webp',
            'properties/test/testpropimage3.webp'
        ]
    },
    {
        name: 'Ghent Riverside Villa',
        owner: host2Id,
        description: 'Spacious villa along the Leie river',
        address: {
            street: 'Coupure Links 2',
            city: 'Ghent',
            country: 'Belgium',
            postalCode: '9000',
            latitude: 51.0535,
            longitude: 3.7304
        },
        pricePerNight: 350,
        maxGuests: 8,
        amenities: [
            {
                type: 'Wifi',
                description: 'Satellite internet'
            },
            {
                type: 'PetFriendly',
                description: 'Dogs welcome'
            }
        ],
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imagePaths: [
            'properties/test/testpropimage1.webp',
            'properties/test/testpropimage2.webp',
            'properties/test/testpropimage3.webp'
        ]
    },
    {
        name: 'Antwerp Loft',
        owner: joske,
        description: 'Modern loft in the diamond district',
        address: {
            street: 'Pelikaanstraat 20',
            city: 'Antwerp',
            country: 'Belgium',
            postalCode: '2000',
            latitude: 51.2177,
            longitude: 4.4208
        },
        pricePerNight: 280,
        maxGuests: 4,
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
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        imagePaths: [
            'properties/test/testpropimage1.webp',
            'properties/test/testpropimage2.webp',
            'properties/test/testpropimage3.webp'
        ]
    }
]);


// Get property IDs
const canalHouse = db.properties.findOne({name: 'Luxury Canal House'})._id;
const ardennesCabin = db.properties.findOne({name: 'Ardennes Cabin'})._id;
const cityApartmentBrussels = db.properties.findOne({name: 'Brussels City Apartment'})._id;
const riversideVillaGhent = db.properties.findOne({name: 'Ghent Riverside Villa'})._id;
const loftAntwerp = db.properties.findOne({name: 'Antwerp Loft'})._id;

// Insert sample bookings
db.bookings.insertMany([
    {
        property: canalHouse,
        guest: joske,
        checkIn: new Date('2024-12-27'),
        checkOut: new Date('2025-01-7'),
        totalPrice: 1750,
        status: 'confirmed',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    },
    {
        property: riversideVillaGhent,
        guest: guest1Id,
        checkIn: new Date('2025-01-13'),
        checkOut: new Date('2025-01-20'),
        totalPrice: 1750,
        status: 'confirmed',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    },
    {
        property: ardennesCabin,
        guest: guest2Id,
        checkIn: new Date('2024-12-24'),
        checkOut: new Date('2024-12-31'),
        totalPrice: 1260,
        status: 'confirmed',
        numberOfGuests: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    },
    {
        property: cityApartmentBrussels,
        guest: guest1Id,
        checkIn: new Date('2025-01-15'),
        checkOut: new Date('2025-01-20'),
        totalPrice: 1000,
        status: 'pending',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    },
    {
        property: loftAntwerp,
        guest: guest2Id,
        checkIn: new Date('2025-02-01'),
        checkOut: new Date('2025-02-07'),
        totalPrice: 2450,
        status: 'confirmed',
        numberOfGuests: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    },
    {
        property: canalHouse,
        guest: guest2Id,
        checkIn: new Date('2025-03-10'),
        checkOut: new Date('2025-03-15'),
        totalPrice: 1250,
        status: 'pending',
        numberOfGuests: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: {
            acvtive: true,
            messages: []
        }
    }
]);

print('Database initialization completed successfully!');