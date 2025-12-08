/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: December 6th, 2025
  description: Scene for displaying frequently asked questions.
*/
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const Faq = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "What is CollabConnect?",
          answer: "CollabConnect is a platform designed to help researchers find and connect with other researchers for collaborative projects. Whether you're looking for expertise in a specific field, seeking co-authors, or wanting to expand your research network, CollabConnect makes it easy to discover the right collaborators."
        },
        {
          question: "How do I create an account?",
          answer: "Creating an account is simple! Click the 'Sign Up' button in the top right corner, fill in your basic information including your research interests and expertise, and verify your email address. You'll then have full access to search for collaborators and manage your profile. You also have the option to claim an already, non claimed, researcher on the page if that researcher is you"
        },
        {
          question: "Is CollabConnect free to use?",
          answer: "Yes, CollabConnect is fully free to use. It will always be an open source, free to use application."
        }
      ]
    },
    {
      category: "Finding Collaborators",
      questions: [
        {
          question: "How do I search for potential collaborators?",
          answer: "To search for potential collaborators, select the Search Collaberators page on the sidebar located on the left. This page will allow you to search for all the researcher CollabConnect has to offer "
        },
        {
          question: "Can I save searches or bookmark researchers?",
          answer: "Absolutely! You can save your search criteria for future use and bookmark researchers you're interested in connecting with. All saved items are accessible from your dashboard for easy reference."
        }
      ]
    },
    {
      category: "Privacy & Data",
      questions: [
        {
          question: "What data does CollabConnect collect?",
          answer: "CollabConnect only collects publicly avalible data to populate its large database of researchers. We at CollabConnect would never use illegally collected data for our application."
        },
        {
          question: "How do I remove my data that CollabConnect collected?",
          answer: "We at CollabConnect respect your privacy and understand that even if publicly avalible, you may not"
          +" want your data hosted on CollabConnect. To request that your data be removed from our database, please visit our data collection page to make a request to delete your data"
        },
        {
          question: "How do I delete my account and data?",
          answer: "You can delete your account at any time from your account settings. Go to Account > Delete Account. This will permanently remove all your personal data that you provided us from our servers."
        },
        {
          question: "Is my data shared with third parties?",
          answer: "No, we do not sell or share your personal data with third parties for marketing purposes. We only share aggregated, anonymized data for research purposes and platform improvement. Any data sharing with service providers (like email services) is done under strict confidentiality agreements."
        }
      ]
    },
    // {
    //   category: "Profile Management",
    //   questions: [
    //     {
    //       question: "How do I update my research interests?",
    //       answer: "Navigate to your profile settings and select 'Edit Profile.' You can add, remove, or modify your research interests, expertise areas, and keywords at any time. We recommend keeping this information current to improve match accuracy."
    //     },
    //     {
    //       question: "Can I link my publications and other academic profiles?",
    //       answer: "Yes! You can connect your ORCID, Google Scholar, ResearchGate, and other academic profiles. This helps verify your research background and makes it easier for potential collaborators to learn about your work."
    //     }
    //   ]
    // },
    // {
    //   category: "Communication & Collaboration",
    //   questions: [
    //     {
    //       question: "How do I reach out to potential collaborators?",
    //       answer: "Once you find a potential collaborator, we have linked their email address and office/cell phone number you can use to contact them! "
    //     },
    //     {
    //       question: "What should I include in my first message?",
    //       answer: "Introduce yourself briefly, mention specific aspects of their work that interest you, and clearly explain what type of collaboration you're proposing. Be professional and respectful of their time."
    //     },
    //     {
    //       question: "Can I collaborate on projects within the platform?",
    //       answer: "Currently, CollabConnect focuses on connecting researchers. Once you've established a connection, you can use your preferred tools for project management and collaboration. We're exploring integrated collaboration features for future releases."
    //     }
    //   ]
    // },
    // {
    //   category: "Technical Support",
    //   questions: [
    //     {
    //       question: "I'm having trouble logging in. What should I do?",
    //       answer: "First, try resetting your password using the 'Forgot Password' link. If issues persist, clear your browser cache and cookies, or try a different browser. If you still can't access your account, contact our support team at support@collabconnect.com."
    //     },
    //     {
    //       question: "Is CollabConnect mobile-friendly?",
    //       answer: "Yes! CollabConnect is fully responsive and works seamlessly on smartphones and tablets. You can search for collaborators, manage your profile, and respond to messages on the go."
    //     },
    //     {
    //       question: "Who do I contact for additional help?",
    //       answer: "For technical issues, billing questions, or general inquiries, email support@collabconnect.com. We typically respond within 24 hours on business days. You can also check our Help Center for detailed guides and tutorials."
    //     }
    //   ]
    // }
  ];

  return (
    <Box m="20px">
      <Box mb="30px">
        <Typography
          variant="h2"
          color={colors.grey[100]}
          fontWeight="bold"
          sx={{ mb: "5px" }}
        >
          Frequently Asked Questions
        </Typography>
        <Typography variant="h5" color={colors.greenAccent[400]}>
          Find answers to common questions about CollabConnect
        </Typography>
      </Box>

      {faqs.map((category, categoryIndex) => (
        <Box key={categoryIndex} mb="30px">
          <Typography
            variant="h4"
            color={colors.greenAccent[500]}
            fontWeight="bold"
            sx={{ mb: "15px" }}
          >
            {category.category}
          </Typography>
          
          {category.questions.map((faq, index) => (
            <Accordion
              key={index}
              defaultExpanded={categoryIndex === 0 && index === 0}
              sx={{
                backgroundColor: colors.primary[400],
                mb: "10px",
                borderRadius: "4px",
                "&:before": {
                  display: "none",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: colors.greenAccent[500] }} />}
                sx={{
                  borderRadius: "4px",
                }}
              >
                <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color={colors.grey[100]} sx={{ lineHeight: 1.8 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      <Box
        mt="40px"
        p="20px"
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
      >
        <Typography variant="h4" color={colors.grey[100]} fontWeight="bold" mb="10px">
          Still have questions?
        </Typography>
        <Typography color={colors.grey[100]}>
          Can't find the answer you're looking for? Please reach out to our support team at{" "}
          <Typography
            component="span"
            sx={{ color: colors.greenAccent[500], fontWeight: "bold" }}
          >
            support@collabconnect.com
          </Typography>
          {" "}and we'll be happy to help!
        </Typography>
      </Box>
    </Box>
  );
};

export default Faq;