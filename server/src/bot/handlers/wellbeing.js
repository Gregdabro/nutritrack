const User = require('../../models/User');
const WellbeingLog = require('../../models/WellbeingLog');
const logger = require('../../logger');
const dayjs = require('dayjs');

const FEEL_EMOJIS = {
  great: '😁',
  good: '🙂',
  ok: '😐',
  bad: '😔',
  sick: '🤒',
};

const DETAIL_NAMES = {
  energy: '⚡ Энергия',
  sleep: '😴 Сон',
  stress: '😤 Стресс',
  mood: '🎭 Настроение',
};

function getDetailsKeyboard(data) {
  const keyboard = [];
  const row1 = [];
  const row2 = [];
  
  if (data.energy === undefined) row1.push({ text: '⚡ Энергия', callback_data: 'feel_detail_energy' });
  if (data.sleep === undefined) row1.push({ text: '😴 Сон', callback_data: 'feel_detail_sleep' });
  if (data.stress === undefined) row2.push({ text: '😤 Стресс', callback_data: 'feel_detail_stress' });
  if (data.mood === undefined) row2.push({ text: '🎭 Настроение', callback_data: 'feel_detail_mood' });

  if (row1.length) keyboard.push(row1);
  if (row2.length) keyboard.push(row2);
  keyboard.push([{ text: 'Пропустить →', callback_data: 'feel_detail_skip' }]);

  return keyboard;
}

async function handleFeelCommand(ctx) {
  const keyboard = [
    [{ text: '😁 Отлично', callback_data: 'feel_great' }],
    [{ text: '🙂 Хорошо', callback_data: 'feel_good' }],
    [{ text: '😐 Нормально', callback_data: 'feel_ok' }],
    [{ text: '😔 Плохо', callback_data: 'feel_bad' }],
    [{ text: '🤒 Болею', callback_data: 'feel_sick' }]
  ];

  await ctx.reply('Как ты себя чувствуешь сегодня?', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function handleFeelOverallAction(ctx) {
  const user = ctx.user;
  const overall = ctx.match[0].replace('feel_', '');
  
  await User.updateOne(
    { _id: user._id },
    { 
      botState: 'awaiting_feel_detail',
      botStateData: { overall, date: dayjs().format('YYYY-MM-DD') }
    }
  );

  const data = { overall };
  await ctx.editMessageText(
    `Твое самочувствие: ${FEEL_EMOJIS[overall]}\nХочешь уточнить детали? (1-5)`,
    { reply_markup: { inline_keyboard: getDetailsKeyboard(data) } }
  );
  await ctx.answerCbQuery();
}

async function handleFeelDetailAction(ctx) {
  const user = ctx.user;
  if (user.botState !== 'awaiting_feel_detail') {
    await ctx.answerCbQuery('Действие устарело', { show_alert: true });
    return;
  }

  const detail = ctx.match[0].replace('feel_detail_', '');
  if (detail === 'skip') {
    return finishWellbeingLog(ctx, user);
  }

  const data = user.botStateData || {};
  data.currentDetail = detail;

  await User.updateOne({ _id: user._id }, { botStateData: data });

  await ctx.editMessageText(
    `Оцени ${DETAIL_NAMES[detail]} от 1 (очень плохо) до 5 (отлично):`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '1', callback_data: `feel_val_1` },
            { text: '2', callback_data: `feel_val_2` },
            { text: '3', callback_data: `feel_val_3` },
            { text: '4', callback_data: `feel_val_4` },
            { text: '5', callback_data: `feel_val_5` },
          ],
          [{ text: 'Отмена', callback_data: 'feel_detail_cancel' }]
        ]
      }
    }
  );
  await ctx.answerCbQuery();
}

async function handleFeelValueAction(ctx) {
  const user = ctx.user;
  if (user.botState !== 'awaiting_feel_detail') {
    await ctx.answerCbQuery('Действие устарело', { show_alert: true });
    return;
  }

  const data = user.botStateData || {};
  if (!data.currentDetail) {
    await ctx.answerCbQuery('Ошибка', { show_alert: true });
    return;
  }

  const value = parseInt(ctx.match[0].replace('feel_val_', ''), 10);
  data[data.currentDetail] = value;
  delete data.currentDetail;

  await User.updateOne({ _id: user._id }, { botStateData: data });

  // If all details filled
  if (data.energy && data.sleep && data.stress && data.mood) {
    return finishWellbeingLog(ctx, user);
  }

  await ctx.editMessageText(
    `Принято! Хочешь уточнить что-то еще?`,
    { reply_markup: { inline_keyboard: getDetailsKeyboard(data) } }
  );
  await ctx.answerCbQuery();
}

async function handleFeelDetailCancel(ctx) {
  const user = ctx.user;
  if (user.botState !== 'awaiting_feel_detail') {
    return ctx.answerCbQuery();
  }
  const data = user.botStateData || {};
  delete data.currentDetail;
  await User.updateOne({ _id: user._id }, { botStateData: data });

  await ctx.editMessageText(
    `Продолжим уточнение?`,
    { reply_markup: { inline_keyboard: getDetailsKeyboard(data) } }
  );
  await ctx.answerCbQuery();
}

async function handleDetailInputText(ctx) {
  const user = ctx.user;
  const data = user.botStateData || {};
  
  if (!data.currentDetail) {
    // If they typed something but we are just showing the details menu
    return ctx.reply('Выбери параметр на клавиатуре выше или нажми "Пропустить".');
  }

  const value = parseInt(ctx.message.text, 10);
  if (isNaN(value) || value < 1 || value > 5) {
    return ctx.reply('Пожалуйста, введи число от 1 до 5.');
  }

  data[data.currentDetail] = value;
  delete data.currentDetail;
  await User.updateOne({ _id: user._id }, { botStateData: data });

  if (data.energy && data.sleep && data.stress && data.mood) {
    return finishWellbeingLog(ctx, user);
  }

  await ctx.reply(
    `Принято! Хочешь уточнить что-то еще?`,
    { reply_markup: { inline_keyboard: getDetailsKeyboard(data) } }
  );
}

async function finishWellbeingLog(ctx, user) {
  try {
    const data = user.botStateData || {};
    const { overall, energy, sleep, stress, mood, date } = data;

    await WellbeingLog.findOneAndUpdate(
      { userId: user._id, date },
      { overall, energy, sleep, stress, mood },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.updateOne({ _id: user._id }, { botState: 'idle', botStateData: null });

    const emoji = FEEL_EMOJIS[overall] || '✅';
    let msg = `✅ ${emoji} Оценка за ${date} записана!`;
    
    // Attempt to edit current message if possible, or reply
    if (ctx.callbackQuery) {
      await ctx.editMessageText(msg);
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(msg);
    }
  } catch (err) {
    logger.error({ err }, 'Error finishing wellbeing log');
    await User.updateOne({ _id: user._id }, { botState: 'idle', botStateData: null });
    const replyFn = ctx.callbackQuery ? ctx.editMessageText.bind(ctx) : ctx.reply.bind(ctx);
    await replyFn('Произошла ошибка при сохранении самочувствия.');
  }
}

module.exports = {
  handleFeelCommand,
  handleFeelOverallAction,
  handleFeelDetailAction,
  handleFeelValueAction,
  handleFeelDetailCancel,
  handleDetailInputText,
};
