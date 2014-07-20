#include "pebble.h"
#include "dataHandler.h"
#include "details_window.h"

int currentId;

int numberOfItemsInCurrentMenu = 0;
int listEndValue = -1;
char **currentTitles;
char **currentSubTitles;
char *currentViewTitle;

static Window *advancedMenuWindow;

// This is a menu layer
// You have more control than with a simple menu layer
static MenuLayer *menu_layer;


// A callback is used to specify the amount of sections of menu items
// With this, you can dynamically add and remove sections
static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
    return 1;
}

// Each section has a number of items;  we use a callback to specify this
// You can also dynamically add and remove items using this
static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    switch (section_index) {
        case 0:
            if(numberOfItemsInCurrentMenu>0) {
                return numberOfItemsInCurrentMenu;
            } else {
                return 1;
            }
            
        default:
            return 0;
    }
}

// A callback is used to specify the height of the section header
static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    // This is a define provided in pebble.h that you may use for the default height
    return MENU_CELL_BASIC_HEADER_HEIGHT;
}

// Here we draw what each header is
static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
    // Determine which section we're working with
    switch (section_index) {
        case 0:
            // Draw title text in the section header
            menu_cell_basic_header_draw(ctx, cell_layer, currentViewTitle);
            break;
    }
}

// This is the menu item draw callback where you specify what each item should look like
static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
    int index = cell_index->row;
    if(index<numberOfItemsInCurrentMenu) {
        menu_cell_basic_draw(ctx, cell_layer, currentTitles[index], currentSubTitles[index], NULL);
    } else {
        if(listEndValue < 0) {
            menu_cell_basic_draw(ctx, cell_layer, "Loading...", "Please wait", NULL);
        } else if(listEndValue == 0) {
            menu_cell_basic_draw(ctx, cell_layer, "Unauthenticated", "Login in app settings", NULL);
        } else if(listEndValue == 1) {
            menu_cell_basic_draw(ctx, cell_layer, "No notes", "Please add notes first", NULL);
        } else {
            menu_cell_basic_draw(ctx, cell_layer, "Error", "Unrecognized error.", NULL);
        }
    }
}
void clear_data() {
    for(int i=0; i<numberOfItemsInCurrentMenu;i++)
    {
        free(currentTitles[i]);
        free(currentSubTitles[i]);
    }
    numberOfItemsInCurrentMenu = 0;
    listEndValue = -1;
    free(currentTitles);
    currentTitles = NULL;
    free(currentSubTitles);
    currentSubTitles = NULL;
}

// Here we capture when a user selects a menu item
void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    if(listEndValue==1) {
        open_details(cell_index->row, currentTitles[cell_index->row]);
    }
}
void menu_long_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    if(listEndValue==1) {
        clear_data();
        menu_layer_reload_data(menu_layer);

        ask_phone_for_data(3,0);
    }
}

// This initializes the menu upon window load
void advancedlist_window_load(Window *window) {
    
    // Now we prepare to initialize the menu layer
    // We need the bounds to specify the menu layer's viewport size
    // In this case, it'll be the same as the window's
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_frame(window_layer);
    
    // Create the menu layer
    menu_layer = menu_layer_create(bounds);
    
    // Set all the callbacks for the menu layer
    menu_layer_set_callbacks(menu_layer, NULL, (MenuLayerCallbacks){
        .get_num_sections = menu_get_num_sections_callback,
        .get_num_rows = menu_get_num_rows_callback,
        .get_header_height = menu_get_header_height_callback,
        .draw_header = menu_draw_header_callback,
        .draw_row = menu_draw_row_callback,
        .select_click = menu_select_callback,
        .select_long_click = menu_long_select_callback
    });
    
    // Bind the menu layer's click config provider to the window for interactivity
    menu_layer_set_click_config_onto_window(menu_layer, window);
    
    // Add it to the window for display
    layer_add_child(window_layer, menu_layer_get_layer(menu_layer));
}

void advancedlist_window_unload(Window *window) {
    // Destroy the menu layer
    menu_layer_destroy(menu_layer);
    clear_data();
    currentViewTitle = NULL;
}

void watchme_data_loaded(int count, char **titles, char **subtitles, int endValue) {
    listEndValue = endValue;
    numberOfItemsInCurrentMenu = count;
    currentTitles = titles;
    currentSubTitles = subtitles;
    menu_layer_reload_data(menu_layer);
}

void open_list(int id) {
    currentId = id;
    currentViewTitle = "infnotes.hern.as";
    
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Advanced menu, items: %d", numberOfItemsInCurrentMenu);
    
    advancedMenuWindow = window_create();
    
    // Setup the window handlers
    window_set_window_handlers(advancedMenuWindow, (WindowHandlers) {
        .load = advancedlist_window_load,
        .unload = advancedlist_window_unload,
    });
    
    window_stack_push(advancedMenuWindow, true /* Animated */);
    
    
    watchme_loaded_callback = watchme_data_loaded;
    ask_phone_for_data(0,0);
}

int main(void) {
    init_data_handler();
    open_list(0);
    app_event_loop();
    
    window_destroy(advancedMenuWindow);
}
