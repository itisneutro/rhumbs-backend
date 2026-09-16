import dataSource from './data-source';

// Таблицы создаёт миграция, synchronize не вызывается нигде.
async function migrate(): Promise<void> {
  await dataSource.initialize();
  const applied = await dataSource.runMigrations();
  await dataSource.destroy();

  if (applied.length === 0) {
    console.log('Новых миграций нет');
    return;
  }

  for (const migration of applied) {
    console.log(`Применена миграция ${migration.name}`);
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
