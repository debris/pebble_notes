#include "pebble.h"
#include "dataHandler.h"
ActionBarLayer *action_bar;
TextLayer *textLayer;

static GBitmap *upArrow;
static GBitmap *downArrow;

int currentIndex = 0;
int currentPage = 0;
int totalPages = 0;
char *detailsTitle;

static Window *detailsWindow;

void up_single_click_handler(ClickRecognizerRef recognizer, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Up tapped %d/%d", currentPage, totalPages);

    if(currentPage>0) {
        text_layer_set_text(textLayer, "Loading...");
        ask_phone_for_data(2,--currentPage);
    }
}
void down_single_click_handler(ClickRecognizerRef recognizer, void *context) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Down tapped %d/%d", currentPage, totalPages);
    if(currentPage<totalPages-1) {
        text_layer_set_text(textLayer, "Loading...");
        ask_phone_for_data(2,++currentPage);
    }
}

void click_config_provider(void *context) {
    window_single_click_subscribe(BUTTON_ID_UP, (ClickHandler) up_single_click_handler);
    window_single_click_subscribe(BUTTON_ID_DOWN, (ClickHandler) down_single_click_handler);
}

void setUpButtonsForActionBar() {
    if(totalPages>0) {
        if(currentPage> 0) {
            action_bar_layer_set_icon(action_bar, BUTTON_ID_UP, upArrow);
        } else {
            action_bar_layer_set_icon(action_bar, BUTTON_ID_UP, NULL);
        }
        
        if(currentPage<totalPages-1) {
            action_bar_layer_set_icon(action_bar, BUTTON_ID_DOWN, downArrow);
        } else {
            action_bar_layer_set_icon(action_bar, BUTTON_ID_DOWN, NULL);
        }
    } else {
        action_bar_layer_set_icon(action_bar, BUTTON_ID_UP, NULL);
        action_bar_layer_set_icon(action_bar, BUTTON_ID_DOWN, NULL);
    }
}

// This initializes the menu upon window load
void details_window_load(Window *window) {
    upArrow = gbitmap_create_with_resource(RESOURCE_ID_UP_ARROW);
    downArrow = gbitmap_create_with_resource(RESOURCE_ID_DOWN_ARROW);
    
    action_bar = action_bar_layer_create();
    action_bar_layer_add_to_window(action_bar, window);
    action_bar_layer_set_click_config_provider(action_bar,
                                               click_config_provider);
    
    ///text layer
    
    Layer *window_layer = window_get_root_layer(detailsWindow);
    GRect bounds = layer_get_frame(window_layer);
    textLayer = text_layer_create(GRect(bounds.origin.x, bounds.origin.y, bounds.size.w-ACTION_BAR_WIDTH, bounds.size.h));
    
    //20 x 10
    layer_add_child(window_layer, (Layer *)textLayer);
//    text_layer_set_overflow_mode(textLayer, GTextOverflowModeFill);
    text_layer_set_text(textLayer, "Loading...");

}
void details_window_unload(Window *window) {
    gbitmap_destroy(upArrow);
    gbitmap_destroy(downArrow);
    text_layer_destroy(textLayer);
    action_bar_layer_remove_from_window(action_bar);
}

void details_loaded(char *text, int pages) {
    totalPages = pages;
    text_layer_set_text(textLayer, text);
    setUpButtonsForActionBar();
    APP_LOG(APP_LOG_LEVEL_DEBUG, "pages %d", pages);
}


void open_details(int index, char *title) {
    currentIndex = 0;
    currentPage = 0;
    totalPages = 0;
    
    currentIndex = index;
    detailsTitle = title;
    
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Opened details %d", currentIndex);
    
    detailsWindow = window_create();
    
    // Setup the window handlers
    window_set_window_handlers(detailsWindow, (WindowHandlers) {
        .load = details_window_load,
        .unload = details_window_unload,
    });
    
    window_stack_push(detailsWindow, true /* Animated */);
    
    data_details_loaded = details_loaded;
    ask_phone_for_data(1,currentIndex);
}
