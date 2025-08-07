import { Box, Container } from "@mui/material";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box minHeight="100vh" display="flex" alignItems="center">
      <Container maxWidth="sm">{children}</Container>
    </Box>
  );
}