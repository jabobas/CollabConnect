import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const DataCollection = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: ""
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: "", email: "", reason: "" });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log("Data removal request submitted:", formData);
    alert("Your data removal request has been submitted. We will process it within 5-7 business days.");
    handleCloseDialog();
  };

  return (
    <Box m="20px">
      <Box mb="30px">
        <Typography
          variant="h2"
          color={colors.grey[100]}
          fontWeight="bold"
          sx={{ mb: "5px" }}
        >
          Data Collection Policy
        </Typography>
        <Typography variant="h5" color={colors.greenAccent[400]}>
          How CollabConnect gathers and manages researcher information
        </Typography>
      </Box>

      <Box
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        p="30px"
        mb="20px"
      >
        <Box display="flex" alignItems="center" mb="20px">
          <InfoOutlinedIcon sx={{ color: colors.greenAccent[500], fontSize: "32px", mr: "10px" }} />
          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
            Our Data Collection Process
          </Typography>
        </Box>

        <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "20px" }}>
          CollabConnect is committed to transparency in how we collect and manage researcher data. 
          Our platform utilizes automated web scrapers to build a comprehensive database of researchers 
          and their work, making it easier for the academic community to connect and collaborate.
        </Typography>

        <Typography variant="h4" color={colors.greenAccent[500]} fontWeight="bold" mb="15px">
          Data Sources
        </Typography>
        
        <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "10px" }}>
          We collect researcher information from the following sources:
        </Typography>

        <Box ml="20px" mb="20px">
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "8px" }}>
            • <strong>University of Southern Maine (USM) Departments:</strong> Faculty profiles, 
            research interests, and contact information from publicly available department pages
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "8px" }}>
            • <strong>Roux Institute of Technology:</strong> Researcher profiles, projects, 
            and collaboration opportunities listed on their public website
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "8px" }}>
            • <strong>National Institutes of Health (NIH):</strong> Grant information, 
            principal investigators, and research project details from NIH's public databases
          </Typography>
        </Box>

        <Box
          backgroundColor={colors.greenAccent[700]}
          borderLeft={`4px solid ${colors.greenAccent[500]}`}
          p="15px"
          mb="20px"
        >
          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb="5px">
            Important: Publicly Available Data Only
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8 }}>
            <strong>CollabConnect exclusively collects publicly available data.</strong> We only gather 
            information that is already accessible to anyone through official institutional websites and 
            public databases. We never access private databases, behind paywalls, or use any illegally 
            obtained information. All data collected is information that researchers or their institutions 
            have chosen to make publicly available.
          </Typography>
        </Box>

        <Typography variant="h4" color={colors.greenAccent[500]} fontWeight="bold" mb="15px">
          What Information We Collect
        </Typography>
        
        <Box ml="20px" mb="20px">
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "5px" }}>
            • Name and professional title
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "5px" }}>
            • Institutional affiliation and department
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "5px" }}>
            • Research interests and areas of expertise
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "5px" }}>
            • Contact information (email, office phone, if publicly listed)
          </Typography>
          <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "5px" }}>
            • Publications and grants (when publicly available)
          </Typography>
        </Box>

        <Typography variant="h4" color={colors.greenAccent[500]} fontWeight="bold" mb="15px">
          Your Privacy Rights
        </Typography>
        
        <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "20px" }}>
          We respect your right to privacy. Even though the data we collect is publicly available, 
          we understand you may prefer not to have your information hosted on CollabConnect. 
          You have the right to request removal of your data from our platform at any time.
        </Typography>
         <Typography variant="h4" color={colors.greenAccent[500]} fontWeight="bold" mb="15px">
          When was Data Last Scraped
        </Typography>
        
        <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "10px" }}>
            Our scrapping process was last ran on November 15th, 2025
         </Typography>
      </Box>

      <Box
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        p="30px"
        textAlign="center"
      >
        <DeleteOutlineIcon sx={{ color: colors.redAccent[500], fontSize: "48px", mb: "15px" }} />
        <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" mb="15px">
          Request Data Removal
        </Typography>
        <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8, mb: "20px" }}>
          If you would like your data removed from CollabConnect, please click the button below 
          to submit a removal request. We will process your request within 5-7 business days.
        </Typography>
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          sx={{
            backgroundColor: colors.redAccent[500],
            color: colors.grey[100],
            fontSize: "14px",
            fontWeight: "bold",
            padding: "10px 20px",
            "&:hover": {
              backgroundColor: colors.redAccent[600],
            },
          }}
        >
          Request Data Removal
        </Button>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">
            Data Removal Request
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[100]} sx={{ mb: "20px", lineHeight: 1.6 }}>
            Please provide your information below. We will review your request and remove 
            your data from our database within 5-7 business days.
          </Typography>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: colors.grey[100],
                "& fieldset": {
                  borderColor: colors.grey[300],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[500],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.greenAccent[500],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[100],
              },
            }}
          />
          <TextField
            fullWidth
            required
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: colors.grey[100],
                "& fieldset": {
                  borderColor: colors.grey[300],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[500],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.greenAccent[500],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[100],
              },
            }}
          />
          <TextField
            fullWidth
            label="Reason for Removal (Optional)"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
            placeholder="Please let us know why you'd like your data removed. This helps us improve our service."
            sx={{
              "& .MuiOutlinedInput-root": {
                color: colors.grey[100],
                "& fieldset": {
                  borderColor: colors.grey[300],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[500],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.greenAccent[500],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[100],
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: "20px" }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.primary[300],
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.email}
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[500],
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.greenAccent[600],
              },
              "&:disabled": {
                backgroundColor: colors.grey[700],
                color: colors.grey[500],
              },
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataCollection;