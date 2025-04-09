"use client"
import Link from "next/link";
import { List, ListItemIcon, ListItemButton, ListItemText} from "@mui/material";
import {House, TrendingUp, AttachMoney, People} from "@mui/icons-material"
import { useState } from "react";
import styles from "./Nav.module.css"

export const Nav = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleListItemClick = (index: number) => {
        console.log(index);
      setSelectedIndex(index);
    };

    return(
        <div className={styles.divContainer}> 
            <List component="nav" aria-label="main mailbox folders">
                <ListItemButton selected={selectedIndex === 0} onClick={() => handleListItemClick(0)} component={Link} href="/">
                    <ListItemIcon>
                        <House />
                    </ListItemIcon>
                    <ListItemText primary="Inicio"/>
                </ListItemButton>
                <ListItemButton selected={selectedIndex === 1} onClick={() => handleListItemClick(1)} component={Link} href="/cliente">
                    <ListItemIcon>
                        <People />
                    </ListItemIcon>
                    <ListItemText primary="Clientes" />
                </ListItemButton>
                <ListItemButton selected={selectedIndex === 2} onClick={() => handleListItemClick(2)} component={Link} href="/vendedor">
                    <ListItemIcon>
                        <AttachMoney />
                    </ListItemIcon>
                    <ListItemText primary="Vendedores" />
                </ListItemButton>
                <ListItemButton selected={selectedIndex === 3} onClick={() => handleListItemClick(3)} component={Link} href="/ventas">
                    <ListItemIcon>
                        <TrendingUp />
                    </ListItemIcon>
                    <ListItemText primary="Ventas"/>
                </ListItemButton>
            </List>

        </div>
    )
}