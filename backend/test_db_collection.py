from database import SessionLocal
import models, schemas, uuid
db = SessionLocal()
try:
    user = db.query(models.User).first()
    if user:
        col = schemas.CollectionCreate(title='Test Collection manual', status='active')
        # Simulate crud.create_collection
        db_collection = models.Collection(**col.dict(), owner_id=user.id)
        db.add(db_collection)
        db.commit()
        db.refresh(db_collection)
        print(f'Successfully created collection with ID: {db_collection.id}')
    else:
        print('Error: No users found in database.')
except Exception as e:
    print(f'Error during creation: {e}')
finally:
    db.close()
