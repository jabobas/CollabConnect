# Collab Connect Frontend

This frontend looks to provide a user friendly experience to help our users to connect with industry professionals

## Running the Frontend

Running the frontend for Collab Connect is a very simple process. To start, first open a terminal and cd into 
the frontend directory. Once here, run `npm install`. This command will automatically download all the neccesary 
packages to run the frontend. Note, this may take some time. 

Once all the packages are downloaded, simply run `npm run start`. This will start the frontend, hosted on 
http://localhost:3000/. Thats it! Now the frontend for CollabConnect should be up and running. 

## Development Tips

There are a few components to take note of during development. 

### Page Headers

For a frontend to remain professional, consistancy is key. So, it's important to keep each page consistent with the same
style. This starts with the page header. Here is an example of what the header looks like: 

Imports:
```
import { Box } from "@mui/material";
import Header from "../../components/Header";
```

Code:
```
    <Box m="20px">
      <Box
        display="flex"
        justifyContent={"space-between"}        
        alignItems={"center"}        
      >      
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />  
      </Box> 
    </Box>

```
**Note, this may in the future be turned into a component to allow ease of use.**

This code sample will generates this atop your page

<img width="252" height="94" alt="image" src="https://github.com/user-attachments/assets/fcbe6d39-d91b-4b20-a2c8-81398febc183" />

### Creating a new page

1.) Define Route
When creating a new page, there are two keys to do. First is to look into the App.js file. This generate all the possible frontend 
routes for CollabConnect. When creating a page, your just looking for this rough snippet of code:

```
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<SearchCollab />} />
            </Routes>
```

Each `<Route>` takes in two parameters. The first being the route you want the page to generate on `path="/search"`,
and the second being the component that is the content of your page. `element={<SearchCollab />} ` 
So, your route will look like this `<Route path="/Your-Route-Here" element={<Your Component Here />} />`

Your route definition can be whatever you would like it to be, just remember what it is for the next step. 

2.) Add to Sidebar

The Sidebar is our primary navigator for CollabConnect. So, if a new route is defined, it needs to be added to our 
sidebar. The sidebar can be found in src -> scenes -> global -> Sidebar.jsx

This file is longer and can be harder to navigate, but the only thing you are looking for this comment:
`  {/* DEFINE YOUR ROUTE PUSHES HERE  */}`, which states where the route definitions begin in the sidebar. 

Each one is defined in an Item, which will look like this:

```
            <Item
              title="Manage Connections"
              to="/connections"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
```

In this case, the item above generates the following side bar item, which pushes to /connections when clicked. 

<img width="188" height="34" alt="image" src="https://github.com/user-attachments/assets/194b8d75-b6e5-4f57-aeaf-2458dce65f99" />


So, to define your new item, fill in the title, route you picked for your page, and the icon you want to appear. The icons we are using 
come from the website https://mui.com/material-ui/material-icons/?query=search This website allows you to search for the icon you would 
like to use. Once you pick an icon from the website, the website will give you the import you need to use to use the icon which can be 
defined atop the page. 

Once these two steps are complete and saved, your icon should appear on the sidebar, and when clicked it will take you to your page.





