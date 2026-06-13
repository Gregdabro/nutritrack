async function helpHandler(ctx) {
  const helpText = `
Доступные команды:
/today - Сводка за сегодня (БЖУ, тренировки)
/train - Добавить тренировку
/feel - Записать самочувствие
/weight - Записать текущий вес
/stats - Сводка за неделю
/goals - Текущие цели на день
/repeat - Повторить последний прием пищи (вчерашний завтрак, например)
/cancel - Отменить текущее действие
/help - Показать этот список команд
`;
  await ctx.reply(helpText);
}

module.exports = helpHandler;
