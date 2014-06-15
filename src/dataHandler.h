void init_data_handler();
void (*watchme_loaded_callback)(int count, char **titles);
void (*data_details_loaded)(char *text, int pages);
char **titles;
bool ask_phone_for_data(int type, int id);

