/*
Author: Aubin Mugisha
Email verification page for entering 6-digit verification code.
*/

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import LockIcon from "@mui/icons-material/Lock";

const VerifyEmail = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      // If user came here directly without email in state, send them back to register
      navigate("/register");
    }
  }, [location.state, navigate]);

  const handleCodeChange = (index, value) => {
    // Only allow single digit (0–9)
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode([...newCode, ...Array(6 - newCode.length).fill("")]);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/auth/verify", {
        email,
        code: verificationCode,
      });

      if (response.data.status === "success") {
        setSuccess("Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await axios.post("/auth/resend-code", { email });

      if (response.data.status === "success") {
        setSuccess("Verification code resent! Check your email.");
        setCode(["", "", "", "", "", ""]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to resend code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Box m="20px">
      <Header
        title="Verify Email"
        subtitle="Enter the verification code sent to your email"
      />

      <Box maxWidth="600px" mx="auto" mt="40px">
        <Paper
          elevation={3}
          sx={{
            backgroundColor: colors.primary[400],
            borderRadius: "12px",
            p: "50px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "25px",
          }}
        >
          <Box
            sx={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: colors.greenAccent[600],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <MarkEmailReadIcon
              sx={{ fontSize: 40, color: colors.grey[100] }}
            />
          </Box>

          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            color={colors.grey[100]}
          >
            Check Your Email
          </Typography>

          <Typography
            variant="body1"
            textAlign="center"
            color={colors.grey[300]}
          >
            We sent a verification code to
          </Typography>
          <Typography
            variant="h5"
            fontWeight="600"
            textAlign="center"
            color={colors.greenAccent[500]}
          >
            {email}
          </Typography>

          {error && <Alert sx={{ width: "100%" }} severity="error">{error}</Alert>}
          {success && (
            <Alert sx={{ width: "100%" }} severity="success">
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleVerify} sx={{ width: "100%" }}>
            <Box
              display="flex"
              justifyContent="center"
              gap="12px"
              mb={3}
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <TextField
                  key={index}
                  id={`code-input-${index}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                    },
                  }}
                  sx={{
                    width: "60px",
                    "& .MuiOutlinedInput-root": {
                      height: "70px",
                      "& fieldset": {
                        borderColor: colors.primary[300],
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": { borderColor: colors.greenAccent[500] },
                      "&.Mui-focused fieldset": {
                        borderColor: colors.greenAccent[600],
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: colors.grey[100],
                    },
                  }}
                />
              ))}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || code.join("").length !== 6}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                fontSize: "16px",
                fontWeight: "bold",
                padding: "14px",
                mb: 2,
                "&:hover": { backgroundColor: colors.greenAccent[700] },
                "&:disabled": {
                  backgroundColor: colors.primary[300],
                  color: colors.grey[500],
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Verify Email"}
            </Button>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={1}
          >
            <Typography variant="body2" color={colors.grey[300]}>
              Didn't receive the code?
            </Typography>
            <Button
              onClick={handleResendCode}
              disabled={resending}
              sx={{
                color: colors.greenAccent[500],
                textTransform: "none",
                fontSize: "14px",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              {resending ? "Sending..." : "Resend Code"}
            </Button>
          </Box>

          <Box display="flex" justifyContent="center" mt={2}>
            <Typography
              variant="body2"
              sx={{
                color: colors.grey[400],
                cursor: "pointer",
                "&:hover": {
                  color: colors.greenAccent[500],
                  textDecoration: "underline",
                },
              }}
              onClick={() => navigate("/register")}
            >
              ← Back to Register
            </Typography>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mt={2}
            p={2}
            borderRadius="8px"
            backgroundColor={colors.primary[500]}
          >
            <LockIcon sx={{ fontSize: 16, color: colors.grey[400] }} />
            <Typography variant="caption" color={colors.grey[400]}>
              Code expires in 15 minutes
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default VerifyEmail;
