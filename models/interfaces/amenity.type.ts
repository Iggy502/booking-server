export enum AmenityType {
    Wifi = 'Wifi',
    Parking = 'Parking',
    Pool = 'Pool',
    Gym = 'Gym',
    Restaurant = 'Restaurant',
    Bar = 'Bar',
    Spa = 'Spa',
    PetFriendly = 'PetFriendly',
    RoomService = 'RoomService'
}

export interface IAmenity {
    type: AmenityType;
    description: string;
    amount?: number;
}