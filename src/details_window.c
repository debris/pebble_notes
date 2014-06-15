#include "pebble.h"

ActionBarLayer *action_bar;

int currentId = 0;
char *detailsTitle;

static Window *detailsWindow;

void click_config_provider(void *context) {
//    window_single_click_subscribe(BUTTON_ID_DOWN, (ClickHandler) my_next_click_handler);
//    window_single_click_subscribe(BUTTON_ID_UP, (ClickHandler) my_previous_click_handler);
}


// This initializes the menu upon window load
void details_window_load(Window *window) {
    action_bar = action_bar_layer_create();
    action_bar_layer_add_to_window(action_bar, window);
    action_bar_layer_set_click_config_provider(action_bar,
                                               click_config_provider);
//    action_bar_layer_set_icon(action_bar, BUTTON_ID_UP, &my_icon_previous);
//    action_bar_layer_set_icon(action_bar, BUTTON_ID_DOWN, &my_icon_next);
}
void details_window_unload(Window *window) {
    
}


void open_details(int id, char *title) {
    currentId = id;
    detailsTitle = title;
    
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Opened details %d", id);
    
    detailsWindow = window_create();
    
    // Setup the window handlers
    window_set_window_handlers(detailsWindow, (WindowHandlers) {
        .load = details_window_load,
        .unload = details_window_unload,
    });
    
    window_stack_push(detailsWindow, true /* Animated */);
    
}
