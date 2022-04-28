from rating.models import Rating
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Adds users for the ratings from MovieLens dataset'

    def handle(self, *args, **options):
        try:
            user_ids = list(Rating.objects.values_list('user_id', flat=True).distinct().order_by('user_id'))
            existing_users = list(User.objects.values_list('id', flat=True).distinct().order_by('id'))
            #print("Existing ratings user_ids:",len(user_ids))
            #print("Highest ID:", max(user_ids))
            new_users_val = max(user_ids)-len(existing_users)
            for i in range(new_users_val):
                username_ = 'user'+str(i+154827)
                email_ = 'user'+str(i+154827)+'@gmail.com'
                user = User.objects.create_user(username=username_, email=email_, password='tech')
                print("Created user:", user.username, user.email)

        except Exception as e:
            raise CommandError('Something went wrong:',e)