    #include "pebble.h"
    #include "dataHandler.h"
    #include "string.h"




bool ask_phone_for_data(int type, int id) {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    if (iter == NULL) {
        APP_LOG(APP_LOG_LEVEL_DEBUG, "null iter");
        return false;
    }
    
    Tuplet tuple = TupletInteger(4, type);
    dict_write_tuplet(iter, &tuple);
    
    Tuplet tuple2 = TupletInteger(5, id);
    dict_write_tuplet(iter, &tuple2);
    dict_write_end(iter);
    
    app_message_outbox_send();
    return true;
}
    
void out_sent_handler(DictionaryIterator *sent, void *context) {
 }


 void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
 }

int numberOfItems = 0;
 void in_received_handler(DictionaryIterator *received, void *context) {  
	 APP_LOG(APP_LOG_LEVEL_DEBUG, "Got some message from phone");
	 Tuple *numberOfItemsTuple = dict_find(received, 0);
	 Tuple *currentItemTuple = dict_find(received, 1);
     
	 int currentItem = 0;

	 if (numberOfItemsTuple) {
		 numberOfItems = numberOfItemsTuple->value->uint16;
		 APP_LOG(APP_LOG_LEVEL_DEBUG, "numberOfItems: %d", numberOfItems);
         titles = malloc(numberOfItems * sizeof(char*));
     }
	 if (currentItemTuple) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "currentItem found %d", currentItem);
		 currentItem = currentItemTuple->value->uint16;
		 

		 Tuple *titleTuple = dict_find(received, 2);
		 char *title = "";
		 
		 if(titleTuple) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "title typle found");
			 title = titleTuple->value->cstring;
             titles[currentItem] = malloc(strlen(title) * sizeof(char*));
             strcpy(titles[currentItem], title);
             currentItem++;
		 }		 APP_LOG(APP_LOG_LEVEL_DEBUG, "item%d  %s", currentItem, title);
	 }
	 Tuple *endedTuple = dict_find(received, 3);
     if(endedTuple) {
         APP_LOG(APP_LOG_LEVEL_DEBUG, "Last item received! Total %d", numberOfItems);
         watchme_loaded_callback(numberOfItems, titles);
     }
     //Details
     int pages = 0;
	 Tuple *pagesTuple = dict_find(received, 7);
     if(pagesTuple) {
         pages = pagesTuple->value->uint16;
     }
	 Tuple *textTuple = dict_find(received, 6);
     if(textTuple) {
         APP_LOG(APP_LOG_LEVEL_DEBUG, "Text received");
         data_details_loaded(textTuple->value->cstring, pages);
     }
 }


 void in_dropped_handler(AppMessageResult reason, void *context) {
   // incoming message dropped
             APP_LOG(APP_LOG_LEVEL_DEBUG, "Incoming message dropped because of AppMessageResult.%d", reason); 
 }

void init_data_handler() {
   app_message_register_inbox_received(in_received_handler);
   app_message_register_inbox_dropped(in_dropped_handler);
   app_message_register_outbox_sent(out_sent_handler);
   app_message_register_outbox_failed(out_failed_handler);

   app_message_open(app_message_inbox_size_maximum(), app_message_inbox_size_maximum());
}

