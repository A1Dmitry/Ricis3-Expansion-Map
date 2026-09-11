/**
 * Domain constants for Kinematics & Singularity Resolution (DDD & Anti-Magic Numbers).
 * Single Source of Truth for physical thresholds, singularity tolerances, and damping factors.
 */

export class KinematicConstants {
  /** Default delta time for kinematic stepping (seconds, ~60 FPS) */
  public static readonly DEFAULT_DT_SECONDS = 0.016;

  /** Absolute determinant threshold below which Jacobian is considered singular */
  public static readonly SINGULARITY_DETERMINANT_THRESHOLD = 0.15;

  /** Boundary clearance buffer to avoid division by zero or domain boundary breakdown (meters) */
  public static readonly BOUNDARY_EPSILON_METERS = 1e-4;

  /** Small projection offset inside the reachable manifold (meters) */
  public static readonly MANIFOLD_PROJECTION_OFFSET_METERS = 0.001;

  /** Minimum reach buffer to prevent zero-thickness radial singularities (meters) */
  public static readonly MIN_REACH_BUFFER_METERS = 0.05;

  /** Minimum radial division guard to prevent division by zero in polar coordinate conversion */
  public static readonly MIN_RADIAL_DISTANCE_GUARD = 1e-6;

  /** Maximum allowed angle deviation (degrees) for stable vector preservation in singular zones */
  public static readonly MAX_SINGULAR_DIRECTION_DEVIATION_DEG = 3.5;

  /** Threshold for severe degradation of directional tracking in classical DLS (degrees) */
  public static readonly DEGRADED_DIRECTION_THRESHOLD_DEG = 8.0;

  /** Default damping parameter lambda for classical baseline DLS solver */
  public static readonly DEFAULT_DLS_DAMPING_FACTOR = 0.15;

  /** Default damping parameter lambda for ghost comparison arm */
  public static readonly DEFAULT_GHOST_DLS_DAMPING_FACTOR = 0.18;

  /** Azimuth tracking velocity gain for base rotation */
  public static readonly AZIMUTH_TRACKING_GAIN = 2.5;

  /** Planar tracking velocity gain for DLS */
  public static readonly DLS_PLANAR_VELOCITY_GAIN = 3.0;

  /** Euler integration lerp rate multiplier for exact algebraic manifold tracking */
  public static readonly RICIS_LERP_RATE_MULTIPLIER = 8.0;

  /** Joint 3 (elbow) minimum limit to avoid mechanical self-collision (rad) */
  public static readonly MIN_ELBOW_JOINT_LIMIT_RAD = 0.01;

  /** Joint 3 (elbow) maximum limit (rad) */
  public static readonly MAX_ELBOW_JOINT_LIMIT_OFFSET_RAD = 0.05;

  /** Workspace reach boundary margin multiplier for validity checks */
  public static readonly WORKSPACE_BOUNDARY_MARGIN_RATIO = 1.05;

  /** Score normalization base for 100% QA score */
  public static readonly QA_MAX_SCORE = 100;

  /** Minimum QA score boundary */
  public static readonly QA_MIN_SCORE = 20;
}
