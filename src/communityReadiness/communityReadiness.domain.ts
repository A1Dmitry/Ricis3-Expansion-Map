import type { CommunityRewardsClientStatus } from '../services/communityRewardsClient';

export type CommunityReadinessKind =
  | 'programme_unconfigured'
  | 'availability_unreachable'
  | 'availability_invalid';

export interface CommunityReadinessProjection {
  readonly kind: CommunityReadinessKind;
  readonly title: string;
  readonly statusLabel: string;
  readonly detail: string;
  readonly invitationStatement: string;
  readonly rewardStatement: string;
  readonly botStatement: string;
  readonly authorityStatement: string;
}

const fixedStatements = Object.freeze({
  invitationStatement: 'Ссылка приложения может быть скопирована только по вашему явному действию.',
  rewardStatement: 'Награды, токены, баланс, реферальный код и учётная запись в этой панели не создаются и не подтверждаются.',
  botStatement: 'Внешний Telegram-бот не подключён; опубликованная Telegram-панель является только локальной симуляцией.',
  authorityStatement: 'Открытие, чтение или закрытие панели не изменяет RICIS III v7.7, P=NP, Lean/TeX, Core, proof, source, provenance, trust, state, node или solution status.',
});

function project(
  kind: CommunityReadinessKind,
  title: string,
  statusLabel: string,
  detail: string,
): CommunityReadinessProjection {
  return Object.freeze({ kind, title, statusLabel, detail, ...fixedStatements });
}

/**
 * Converts the existing already-normalized availability status into a local,
 * read-only presentation model. This projector intentionally owns no I/O,
 * account, referral, reward, ledger, bot, provider or authority semantics.
 */
export function projectCommunityReadiness(status: CommunityRewardsClientStatus): CommunityReadinessProjection {
  switch (status.kind) {
    case 'backend_unconfigured':
      return project(
        'programme_unconfigured',
        'Готовность сообщества',
        'Программа наград пока не подключена',
        'Для запуска потребуются защищённая identity и долговечный server ledger. До отдельной утверждённой программы никаких наград или реферальных данных нет.',
      );
    case 'backend_unreachable':
      return project(
        'availability_unreachable',
        'Готовность сообщества',
        'Статус программы временно недоступен',
        'Не удалось получить availability status. Это не означает наличие наград, токенов, баланса, учётной записи или реферальных данных.',
      );
    case 'invalid_response':
      return project(
        'availability_invalid',
        'Готовность сообщества',
        'Статус программы не подтверждён',
        'Система не подтвердила корректный availability status. Никакие награды, токены, баланс, учётная запись или реферальные данные не созданы.',
      );
  }
}
