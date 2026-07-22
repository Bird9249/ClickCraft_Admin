export const Permissions = {
  users: {
    create: "users:create",
    read: "users:read",
    update: "users:update",
    delete: "users:delete",
    ban: "users:ban",
  },
  audit: {
    read: "audit:read",
  },
  customers: {
    create: "customers:create",
    read: "customers:read",
    update: "customers:update",
    delete: "customers:delete",
  },
  finance: {
    read: "finance:read",
    write: "finance:write",
    issue: "finance:issue",
    void: "finance:void",
  },
  leads: {
    read: "leads:read",
    update: "leads:update",
    convert: "leads:convert",
  },
} as const;

export const ALL_PERMISSIONS = Object.entries(Permissions).flatMap(
  ([resource, actions]) =>
    Object.entries(actions).map(([action, id]) => ({ id, resource, action })),
);

export type PermissionId = (typeof ALL_PERMISSIONS)[number]["id"];

export const RESOURCE_LABELS: Record<string, string> = {
  users: "ຜູ້ໃຊ້",
  audit: "ບັນທຶກການກວດກາ",
  customers: "ລູກຄ້າ",
  finance: "ການເງິນ",
  leads: "ຄຳຂໍໃບສະເໜີລາຄາ",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "ສ້າງ",
  read: "ເບິ່ງ",
  update: "ແກ້ໄຂ",
  delete: "ລຶບ",
  ban: "ລະງັບ",
  write: "ຂຽນ",
  issue: "ອອກເອກະສານ",
  void: "ຍົກເລີກ",
  convert: "ແປງ",
  all: "ທັງໝົດ",
};

export function getResourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getPermissionLabel(id: PermissionId): string {
  const [resource, action] = (id as string).split(":");
  return `${getActionLabel(action ?? "")} ${getResourceLabel(resource ?? "")}`;
}

export function getPermissionLabels(ids: PermissionId[]): string[] {
  return ids.map((id) => getPermissionLabel(id));
}
