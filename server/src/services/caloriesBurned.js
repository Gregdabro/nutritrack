const MET = {
  home: 4.5,
  gym:  5.5,
  run:  8.0,
  bike: 7.5,
  swim: 7.0,
};

const DEFAULT_MET = 4.0;

/**
 * Calculate calories burned using MET formula.
 * Calories = MET × weightKg × (durationMinutes / 60)
 *
 * @param {string} type - Workout type (home|gym|run|bike|swim|other|...)
 * @param {number} durationMinutes
 * @param {number} userWeightKg
 * @returns {number} Rounded calories burned
 */
function calcCaloriesBurned(type, durationMinutes, userWeightKg) {
  const met = MET[type] ?? DEFAULT_MET;
  return Math.round(met * userWeightKg * (durationMinutes / 60));
}

module.exports = { calcCaloriesBurned };
