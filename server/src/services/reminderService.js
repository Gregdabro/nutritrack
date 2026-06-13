const cron = require('node-cron');
const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const Goal = require('../models/Goal');
const WellbeingLog = require('../models/WellbeingLog');
const logger = require('../logger');
const { progressBar } = require('../bot/utils');

/**
 * Returns YYYY-MM-DD for a specific Date in the given timezone.
 * @param {Date} dateObj 
 * @param {string} timeZone 
 * @returns {string}
 */
function getDateString(dateObj, timeZone) {
  // sv-SE gives YYYY-MM-DD format naturally in Intl.DateTimeFormat
  return new Intl.DateTimeFormat('sv-SE', { timeZone }).format(dateObj);
}

/**
 * Helper to get user's totals for a given date
 * @param {ObjectId} userId 
 * @param {string} dateStr 
 */
async function getDayTotals(userId, dateStr) {
  const logs = await FoodLog.find({ userId, date: dateStr }).lean();
  const zero = { protein: 0, fat: 0, carbs: 0, calories: 0 };
  if (!logs.length) return zero;
  
  return logs.reduce((acc, log) => {
    const t = log.totals || {};
    return {
      protein:  Math.round((acc.protein  || 0) + (t.protein  || 0)),
      fat:      Math.round((acc.fat      || 0) + (t.fat      || 0)),
      carbs:    Math.round((acc.carbs    || 0) + (t.carbs    || 0)),
      calories: Math.round((acc.calories || 0) + (t.calories || 0)),
    };
  }, zero);
}

let isProcessing = false;

function startReminderService(bot) {
  cron.schedule('* * * * *', async () => {
    if (isProcessing) {
      logger.warn('Previous cron cycle is still processing, skipping this minute');
      return;
    }
    
    isProcessing = true;
    try {
      const users = await User.find({
        $or: [
          { 'reminders.morningEnabled': true },
          { 'reminders.eveningEnabled': true }
        ]
      });

      const now = new Date();

      for (const user of users) {
        try {
          // Determine current time in user's timezone (HH:mm)
          const userTimeStr = new Intl.DateTimeFormat('sv-SE', {
            timeZone: user.timezone || 'Europe/Rome',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
          }).format(now); // e.g. "08:00"

          const r = user.reminders || {};

          // -- Morning Reminder --
          if (r.morningEnabled && r.morningTime === userTimeStr) {
            const yesterdayObj = new Date(now.getTime() - 86400000);
            const yesterdayStr = getDateString(yesterdayObj, user.timezone || 'Europe/Rome');
            
            const [goal, totals] = await Promise.all([
              Goal.findOne({ userId: user._id }).lean(),
              getDayTotals(user._id, yesterdayStr)
            ]);

            const g = goal || { protein: 100, fat: 100, carbs: 200, calories: 2100 };
            
            let msg = '☀️ Доброе утро!\n\n';
            if (totals.calories > 0) {
              const pRatio = Math.round((totals.protein / g.protein) * 100) || 0;
              const fRatio = Math.round((totals.fat / g.fat) * 100) || 0;
              const cRatio = Math.round((totals.carbs / g.carbs) * 100) || 0;

              msg += `Вчера (${yesterdayStr}):\n`;
              msg += `Белки:    ${progressBar(totals.protein, g.protein)} ${pRatio}%\n`;
              msg += `Жиры:     ${progressBar(totals.fat, g.fat)} ${fRatio}%\n`;
              msg += `Углеводы: ${progressBar(totals.carbs, g.carbs)} ${cRatio}%\n`;
              msg += `Калории: ${totals.calories} / ${g.calories} ккал\n\n`;
            }

            msg += `Цели на сегодня:\nБ ${g.protein}г / Ж ${g.fat}г / У ${g.carbs}г`;

            await bot.telegram.sendMessage(user.telegramId, msg);
            logger.info({ userId: user._id.toString() }, 'Sent morning reminder');
          }

          // -- Evening Reminder --
          if (r.eveningEnabled && r.eveningTime === userTimeStr) {
            const todayStr = getDateString(now, user.timezone || 'Europe/Rome');
            
            // Check if wellbeing already logged
            const existingLog = await WellbeingLog.findOne({ userId: user._id, date: todayStr }).lean();
            if (!existingLog) {
              const keyboard = {
                inline_keyboard: [
                  [{ text: '😁 Отлично', callback_data: 'feel_great' }],
                  [{ text: '🙂 Хорошо', callback_data: 'feel_good' }],
                  [{ text: '😐 Нормально', callback_data: 'feel_ok' }],
                  [{ text: '😔 Плохо', callback_data: 'feel_bad' }],
                  [{ text: '🤒 Болею', callback_data: 'feel_sick' }]
                ]
              };
              
              await bot.telegram.sendMessage(
                user.telegramId, 
                'Как себя чувствуешь сегодня?', 
                { reply_markup: keyboard }
              );
              logger.info({ userId: user._id.toString() }, 'Sent evening reminder');
            }
          }

        } catch (userErr) {
          if (userErr.code === 403) {
            logger.warn({ userId: user._id.toString(), err: userErr }, 'User blocked the bot');
          } else {
            logger.error({ userId: user._id.toString(), err: userErr }, 'Failed to send reminder to user');
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in reminderService cron cycle');
    } finally {
      isProcessing = false;
    }
  });
}

module.exports = { startReminderService };
