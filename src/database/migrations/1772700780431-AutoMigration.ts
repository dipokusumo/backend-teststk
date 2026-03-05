import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1772700780431 implements MigrationInterface {
  name = 'AutoMigration1772700780431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`menus\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(150) NOT NULL, \`parent_id\` int NULL, \`order_index\` int NOT NULL, UNIQUE INDEX \`IDX_fd806d377a1476f97751ced288\` (\`parent_id\`, \`title\`), UNIQUE INDEX \`IDX_9a726578ee94f600f8ccc31f58\` (\`parent_id\`, \`order_index\`), INDEX \`IDX_00ccc1ed4e9fc23bc124626935\` (\`parent_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`menus\` ADD CONSTRAINT \`FK_00ccc1ed4e9fc23bc1246269359\` FOREIGN KEY (\`parent_id\`) REFERENCES \`menus\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`menus\` DROP FOREIGN KEY \`FK_00ccc1ed4e9fc23bc1246269359\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_00ccc1ed4e9fc23bc124626935\` ON \`menus\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9a726578ee94f600f8ccc31f58\` ON \`menus\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fd806d377a1476f97751ced288\` ON \`menus\``,
    );
    await queryRunner.query(`DROP TABLE \`menus\``);
  }
}
