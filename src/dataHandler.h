void init_data_handler();
void (*watchme_loaded_callback)(int count, char **titles, char **subtitles, int endValue);
void (*data_details_loaded)(char *text, int pages);
char **titles;
char **subtitles;
bool ask_phone_for_data(int type, int id);

