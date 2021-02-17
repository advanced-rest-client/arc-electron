export interface MenuDefinition {
  menu: MenuItemDefinition[];
}

export class MenuItemDefinition {
  label?: string;
  command?: string;
  accelerator?: string;
  type?: string;
  role?: string;
  submenu?: MenuItemDefinition[];
}