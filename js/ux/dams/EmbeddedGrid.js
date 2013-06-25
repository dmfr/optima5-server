Ext.define('Ext.ux.dams.EmbeddedGrid',{
	extend : 'Ext.grid.Panel',
			  
	alias : 'widget.damsembeddedgrid',
			  
	translateCache : [] , // SUPER CRADE !!!
			  
	initComponent: function(){
		var modelfields = new Array() ;
		var modelvalidations = new Array() ;
		Ext.each( this.columns, function( v ){
			var type = 'string' ;
			if( v.type ) {
				type = v.type ;
			}
			modelfields.push( { name:v.dataIndex, type:type, defaultValue:((typeof v.defaultValue === 'undefined')? '' : v.defaultValue ) } ) ;
			if( v.editor && v.editor.allowBlank == false )
				modelvalidations.push( {type:'length',field:v.dataIndex,min:1} ) ;
		});
		this.modelname = this.id+'-'+'dynModel' ;
		Ext.define(this.modelname,{
			extend: 'Ext.data.Model',
			fields: modelfields,
			validations: modelvalidations
		}) ;
		
		
		// creation du store uniquement !!
		this.linkstore = Ext.create('Ext.data.Store', {
			autoLoad: false,
			autoSync: false,
			model: this.modelname,
			data: this.data || []
		}) ;
		Ext.apply(this,{
			// frame: true,
			//minHeight:300,
			store: this.linkstore
		}) ;
		
		if( !this.readOnly ) {
			this.rowEditing = Ext.create('Ext.grid.plugin.RowEditing');
			this.rowEditing.on('canceledit',this.onCancelEdit,this) ;
			Ext.apply(this,{
				plugins: [this.rowEditing]
			}) ;
			Ext.apply(this,{
				dockedItems: [{
					xtype: 'toolbar',
					items: [{
						text: 'Add',
						iconCls: 'icon-add',
						handler: function(){
							var newRecordIndex = ( this.getSelectedRowIndex() + 1 ) ;
							
							this.linkstore.insert(newRecordIndex, Ext.create(this.modelname) );
							this.rowEditing.startEdit(newRecordIndex, 0);
						},
						scope: this
					}, '-', {
						itemId: 'delete',
						text: 'Delete',
						iconCls: 'icon-delete',
						disabled: true,
						handler: function(){
							var selection = this.getView().getSelectionModel().getSelection()[0];
							if (selection) {
								this.linkstore.remove(selection);
							}
						},
						scope: this
					}]
				}]
			});
		}
		
		
		this.getSelectionModel().on('selectionchange', function(selModel, selections){
			this.down('#delete').setDisabled(selections.length === 0);
		},this);
		
		this.on('destroy',function(){
			var model = Ext.ModelManager.getModel(this.modelname);
			Ext.ModelManager.unregister(model);
		},this) ;
		
		this.callParent() ;
	},
					 
	testFn: function( mfield, mvalue ){
		console.log( mfield + ' ' + mvalue ) ;
	},
			  
	getLinkStore : function(){
		return this.linkstore ;
	},
			  
	getSelectedRowIndex: function(){
		if( this.getSelectionModel().getCount() == 0 )
			return -1 ;
			
		var r = this.getSelectionModel().getSelection();
		var s = this.getStore();
		return s.indexOf(r[0]);
   },
	
	setData: function( tabData ) {
		var ln = tabData.length,
			records = [],
			i = 0;
		for (; i < ln; i++) {
			records.push(Ext.create(this.modelname, tabData[i]));
		}
		this.linkstore.loadData(records) ;
	},
	getData: function() {
		var datar = new Array();
		var jsonDataEncode = "";
		var records = this.linkstore.getRange();
		for (var i = 0; i < records.length; i++) {
			datar.push(records[i].data);
		}
		return datar ;
	},
			  
	onCancelEdit : function(){
		var isnull = false ;
		var records = this.linkstore.getRange();
		var model = this.modelname ;
		for (var i = 0; i < records.length; i++) {
			isnull = true ;
			Ext.Object.each(records[i].data, function(k,v){
				if( v ){
					isnull = false ;
				}
			},this) ;
			if( records[i].validate().getCount() > 0 )
				this.linkstore.remove(records[i]) ;
		}
	}
});