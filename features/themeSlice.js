import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mainColor: '#613a5f',
  backgroundColor: '#806b96',
  tabColor: '#745f8a',
  iconColor: '#f2f2f2',
  iconActiveColor: '#e374b5',
  conAuthorBarColor: '#cebce0',
  convAuthorTextColor: '#545303',
  convAuthorPic: '#613a5f',
  convBackgroundColor: 'white',
  homeConvTitleColor: '#333',
  homeConvBodyColor: '#333',
  topButtonsColors: 'white',
  topButtonsBar: '#806b96',
  userNameColor: '#bab806',
  userIDColor: '#bfbfb0',
  actionColor: '#d4c86e',
  actionInsideColor: '#806b96',
  headerTextColor: 'white',

  //invites
  titleBackground : '#745f8a',
  titleColor : 'white',
  inviteBackground : '#8d8299',
  inviteTitle : 'white',
  inviteTitleBar : '#613a5f',
  inviteAuthor : 'white',
  inviteDate : 'white',
  selectorColor : '#3d243c',
  inviteAuthBar : '#613a5f',

  //friends
  addButton : 'white',
  addButtonInside : '#613a5f',
  friendBackground : '#8d8299',

  //settings
  optionsBackground : '#dad1e3',
  optionsColor : 'grey',
  optionsBar : 'white',

  //status Bar
  statusBarColor: '#613a5f',
  statusBarContent: 'light-content',

  //theme switch
  theme : false,

  //controller
  key : true,
  refresh : null,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setLightTheme: (state) => {
      state.mainColor = '#613a5f',
      state.backgroundColor = '#ebebeb',
      state.tabColor = 'white',
      state.iconColor = '#30162f',
      state.iconActiveColor = '#961570',
      state.conAuthorBarColor = '#806b96',
      state.convAuthorTextColor = 'white',
      state.convAuthorPic = '#806b96',
      state.convBackgroundColor = '#ebebeb',
      state.homeConvTitleColor = 'black',
      state.homeConvBodyColor = 'black',
      state.topButtonsColors = '#30162f',
      state.topButtonsBar = 'white',
      state.userNameColor = '#bab806',
      state.userIDColor = '#bfbfb0',
      state.actionColor = '#d4c86e',
      state.actionInsideColor = '#806b96',
      state.headerTextColor = 'white',

      //invites
      state.titleBackground = '#ebebeb',
      state.inviteBackground = 'white',
      state.inviteTitle = 'white',
      state.inviteTitleBar = '#806b96'
      state.inviteAuthor = '#613a5f',
      state.inviteDate = '#613a5f',
      state.titleColor = '#613a5f'
      state.selectorColor = '#806b96',
      state.inviteAuthBar = '#806b96',

      //friends
      state.addButton = '#613a5f',
      state.addButtonInside = 'white',
      state.friendBackground = '#806b96'

      //settings
      state.optionsBackground = '#dad1e3'
      state.optionsColor = 'white',
      state.optionsBar = '#806b96',

      //status bar
      state.statusBarColor = '#613a5f',
      state.statusBarContent = 'light-content',

      state.theme = true
    },
    
    setDarkTheme: (state) => {
      state.mainColor = '#613a5f',
      state.backgroundColor = '#806b96',
      state.tabColor = '#745f8a'
      state.iconColor = '#f2f2f2',
      state.iconActiveColor = '#e374b5',
      state.conAuthorBarColor = '#cebce0',
      state.convAuthorTextColor = '#545303',
      state.convAuthorPic = '#613a5f',
      state.convBackgroundColor = 'white',
      state.homeConvTitleColor = '#333',
      state.homeConvBodyColor = '#333',
      state.topButtonsColors = 'white',
      state.topButtonsBar = '#806b96',
      state.userNameColor = '#bab806',
      state.userIDColor = '#bfbfb0',
      state.actionColor = '#d4c86e',
      state.actionInsideColor = '#806b96',
      state.headerTextColor = 'white',

      //invites
      state.titleBackground = '#745f8a',
      state.titleColor = 'white',
      state.inviteBackground = '#8d8299',
      state.inviteTitle = 'white',
      state.inviteTitleBar = '#613a5f',
      state.inviteAuthor = 'white',
      state.inviteDate = 'white',
      state.selectorColor = '#3d243c',
      state.inviteAuthBar = '#613a5f',

      //friends
      state.addButton = 'white',
      state.addButtonInside = '#613a5f',
      state.friendBackground = '#8d8299',

      //settings
      state.optionsBackground = '#dad1e3',
      state.optionsColor = 'grey',
      state.optionsBar = 'white',

      //status bar
      state.statusBarColor = '#613a5f',
      state.statusBarContent = 'light-content',

      //theme
      state.theme = false
    },

    setNewKey: (state) => {
      state.key = !state.key
    },

    setRefresh: (state, action) => {
      state.refresh = action.payload
    }
  }
})
//#3a5361
export const { setLightTheme, setDarkTheme, setNewKey, setRefresh } = themeSlice.actions;

export default themeSlice.reducer;