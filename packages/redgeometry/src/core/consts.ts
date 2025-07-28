// Threshold for acute (179.9999 degrees) and obtuse (0.0001 degrees) angles.
export const COS_ACUTE: number = -0.99999999999847689;
export const COS_OBTUSE: number = 0.99999999999847689;

// Threshold for curve splitting (to avoid tiny tail curves).
export const MIN_PARAMETER: number = 5e-7;
export const MAX_PARAMETER: number = 1 - MIN_PARAMETER;
