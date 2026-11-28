
import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Typography,
  IconButton,
} from "@mui/material";

import AppsIcon from "@mui/icons-material/Apps";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";

const AppHeader = ({
  user,
  getShortName,
  setOpenLogo,
  handleMenuOpen,
}) => {
  const isAdmin =
    user?.username?.trim().toLowerCase() === "thaipv";

  return (
    <AppBar
      position="fixed"
      sx={{
        background: "#1976d2",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          minHeight: "48px !important",
          paddingTop: 0,
          paddingBottom: 0,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {/* LOGO + TÊN TRƯỜNG */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src="/Logo.png"
            alt="Logo"
            onClick={() => setOpenLogo(true)}
            sx={{
              height: 34,
              flexShrink: 0,
              ml: { xs: -1, sm: -2 },
              mr: 1,
              cursor: "pointer",
            }}
          />

          <Button
            sx={{
              color: "#fff",
              textTransform: "uppercase",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "default",
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {user?.username
              ? (user?.tenTruong || "TH BÌNH KHÁNH").replace(
                  /^Trường\s+/i,
                  ""
                )
              : "TH BÌNH KHÁNH"}
          </Button>
        </Box>

        {/* THÔNG TIN NGƯỜI DÙNG */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            ml: "auto",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              display: "block",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "inline", sm: "none" } }}
            >
              {getShortName(user?.hoVaTen)}
            </Box>

            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {user?.hoVaTen || ""}
            </Box>
          </Typography>

          {/* ICON TÀI KHOẢN */}
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              bgcolor: isAdmin ? "#FEF3C7" : "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid",
              borderColor: isAdmin ? "#FCD34D" : "#93C5FD",
              boxShadow: isAdmin
                ? "0 2px 8px rgba(217,119,6,0.18)"
                : "0 2px 8px rgba(37,99,235,0.18)",
            }}
          >
            {isAdmin ? (
              <AdminPanelSettingsIcon
                sx={{ color: "#B45309", fontSize: 21 }}
              />
            ) : (
              <PersonIcon sx={{ color: "#1D4ED8", fontSize: 21 }} />
            )}
          </Box>

          {/* MENU ỨNG DỤNG */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: "#fff",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            <AppsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
