export enum ESystem {
    None = -1,
    Reactor = 0,
    BeamWeapons,
    MissileSystem,
    Maneuver,
    Impulse,
    Warp,
    JumpDrive,
    FrontShield,
    RearShield,
    COUNT
}

export const ESystemNames : ReadonlyArray<string> = Array.from(Array(ESystem.COUNT)).map((_, i) => ESystem[i]);
export enum EMissileWeapons {
    None = -1,
    Homing = 0,
    Nuke,
    Mine,
    EMP,
    HVLI,
    COUNT
}
