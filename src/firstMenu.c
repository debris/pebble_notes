#include "pebble.h"
#include "dataHandler.h"
#include "notes_list.h"


#define NUM_MENU_SECTIONS 2
#define NUM_FIRST_MENU_ITEMS 1
#define NUM_SECOND_MENU_ITEMS 2

static Window *window;

// This is a simple menu layer
static SimpleMenuLayer *simple_menu_layer;

// A simple menu layer can have multiple sections
static SimpleMenuSection menu_sections[NUM_MENU_SECTIONS];

// Each section is composed of a number of menu items
static SimpleMenuItem first_menu_items[NUM_FIRST_MENU_ITEMS];
static SimpleMenuItem second_menu_items[NUM_SECOND_MENU_ITEMS];


static void menu_select_callback(int index, void *ctx) {
    //open_list(0, "Notes");
}

// This initializes the menu upon window load
static void window_load(Window *window) {

  first_menu_items[0] = (SimpleMenuItem){
    // You should give each menu item a title and callback
    .title = "All notes",
    .subtitle = "List of all notes",
    .callback = menu_select_callback,
  };
    
    second_menu_items[0] = (SimpleMenuItem){
        // You should give each menu item a title and callback
        .title = "Website",
        .subtitle = "http://infnotes.hern.as"
    };
    second_menu_items[1] = (SimpleMenuItem){
        // You should give each menu item a title and callback
        .title = "Hern.as",
        .subtitle = "Copyrights 2014"
    };

  // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
    .num_items = NUM_FIRST_MENU_ITEMS,
    .items = first_menu_items,
	.title = "Notes" 
  };
  menu_sections[1] = (SimpleMenuSection){
    .num_items = NUM_SECOND_MENU_ITEMS,
    .items = second_menu_items,
	.title = "CREDITS" 
  };

  // Now we prepare to initialize the simple menu layer
  // We need the bounds to specify the simple menu layer's viewport size
  // In this case, it'll be the same as the window's
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  simple_menu_layer = simple_menu_layer_create(bounds, window, menu_sections, NUM_MENU_SECTIONS, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(simple_menu_layer));
}

// Deinitialize resources on window unload that were initialized on window load
void window_unload(Window *window) {
  simple_menu_layer_destroy(simple_menu_layer);
}
//
//int main(void) {
//	init_data_handler();
//  window = window_create();
//
//  // Setup the window handlers
//  window_set_window_handlers(window, (WindowHandlers) {
//    .load = window_load,
//    .unload = window_unload,
//  });
//
//  window_stack_push(window, true /* Animated */);
//
//  app_event_loop();
//
//  window_destroy(window);
//	
//}
