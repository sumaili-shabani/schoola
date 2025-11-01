import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { hasRole } from "../auth/permissions";
import { MENU, MenuItem } from "./menu";
import { useMemo } from "react";
import SidebarBrand from "./SidebarBrand";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
    const { user } = useAuth();
    const { theme } = useTheme();

    // ✅ on typpe explicitement la fonction récursive
    const filteredMenu = useMemo<MenuItem[]>(() => {
        const filter = (items: MenuItem[]): MenuItem[] => {
            return items
                .filter((m) => hasRole(user?.id_role, m.roles))
                .map((m) =>
                    m.children
                        ? { ...m, children: filter(m.children) } // récursion typée
                        : m
                );
        };

        return filter(MENU);
    }, [user?.id_role]);

    return (
        <div className="sidebar-content js-simplebar">
            <SidebarBrand />
            

            <ul className="sidebar-nav" id="sidebar">
                {filteredMenu.map((item, i) => (
                    <SidebarItem key={i} item={item} parent="sidebar" />
                ))}
            </ul>
        </div>
    );
}

function SidebarItem({
    item,
    parent,
}: {
    item: MenuItem;
    parent: string;
}) {
    const hasChildren = !!item.children?.length;
    const collapseId = `${parent}-${item.label.replace(/\s+/g, "-")}`;

    return (
        <li className="sidebar-item">
            {hasChildren ? (
                <>
                    <a
                        data-bs-target={`#${collapseId}`}
                        data-bs-toggle="collapse"
                        className="sidebar-link collapsed"
                    >
                        {item.icon && (
                            <i className="align-middle" data-feather={item.icon}></i>
                        )}
                        <span className="align-middle">{item.label}</span>
                    </a>
                    <ul
                        id={collapseId}
                        className="sidebar-dropdown list-unstyled collapse"
                        data-bs-parent={`#${parent}`}
                    >
                        {item.children?.map((child, j) => (
                            <SidebarItem key={j} item={child} parent={collapseId} />
                        ))}
                    </ul>
                </>
            ) : (
                <NavLink className="sidebar-link" to={item.to || "#"}>
                    {item.icon && (
                        <i className="align-middle" data-feather={item.icon}></i>
                    )}
                    <span className="align-middle">{item.label}</span>
                </NavLink>
            )}
        </li>
    );
}
