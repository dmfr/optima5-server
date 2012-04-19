Ext.define('DamsFieldTreeModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});
	

Ext.define('Ext.ux.dams.FieldTree',{
	extend:'Ext.form.field.Base',
	alias: 'widget.damsfieldtree',
	requires: ['Ext.util.Format', 'Ext.XTemplate','Ext.data.TreeStore','Ext.tree.Panel'], 
	fieldSubTpl: [  
		'<div id="{id}"></div>',
		{
			compiled: true,          
			disableFormats: true     
		}           
	],

	isFormField: true,
	submitValue: true,
	//resizable: true,
	
	allowBlank: true,
	blankText: 'Selection cannot be empty' ,
	invalidCls: 'damsfieldtree-invalid',
	
			  
	afterRender: function() {
		this.callParent();
		
		this.mystore = Ext.create('Ext.data.TreeStore', {
			model: 'DamsFieldTreeModel',
			root: this.dataRoot 
		});
		
		var width = 200 ;
		if( this.width )
			width = this.width ;
		  
		var height = 150 ;
		if( this.height )
			height = this.height ;
		if( this.autoHeight ) {
			var cntStore = 0 ;
			this.mystore.getRootNode().cascadeBy(function(){
				cntStore++ ;
			},this) ;
			if( (cntStore * 25) < height )
				height=(cntStore * 25) ;
			if( height < 50 )
				height = 50 ;
		}

		this.mytree = Ext.create('Ext.tree.Panel', {
			store: this.mystore ,
			displayField: 'nodeText',
			rootVisible: true,
			useArrows: true,
			renderTo: this.getInputId(),
			width: width,
			height: height,
			dockedItems: [{
			hidden: true,
			xtype: 'toolbar',
			items: {
				// hidden: true,
				text: 'Get checked nodes',
				handler: function(){
				var records = this.mytree.getView().getChecked(),
					names = [];
				
				Ext.Array.each(records, function(rec){
					//console.dir(rec) ;
					names.push(rec.get('nodeKey'));
					// rec.set('checked', true);
				});
				
				Ext.MessageBox.show({
					title: 'Selected Nodes',
					msg: names.join('<br />'),
					icon: Ext.MessageBox.INFO
				});
				},
				scope:this
			}
			}]
		});
		
		if( this.readOnlyChecked ) {
			this.mytree.getView().on('checkchange',function(rec,check){
				rec.set('checked',!check) ;
			},this) ;
		}
		else {
			this.mytree.getView().on('checkchange',function(rec,check){
				rec.cascadeBy(function(chrec){
					chrec.set('checked',check) ;
				},this);
				if( !check ) {
					var upRecord = rec ;
					while( upRecord.parentNode ) {
						upRecord.parentNode.set('checked',check) ;
						upRecord = upRecord.parentNode
					}
				}
			},this) ;
		}
		
		// Ext.apply(this, {listeners: {resize: function() {this.mytree.doLayout();}}});
	},
			  
	getSubmitData: function() {
		var stdSubmitData = this.callParent(arguments) ;
		var newSubmitData = new Object() ;
		Ext.Object.each( stdSubmitData , function( k,v ) {
			k = k ;
			v = v ;
			newSubmitData[k] = v ;
		}) ;
		return newSubmitData ;
	},
			  
	getRawValue: function() {
		var checkedKeys = new Array() ;
		if( this.mystore ) {
			this.mystore.getRootNode().cascadeBy(function(rec){
				if( rec.get('checked') == true ) {
					checkedKeys.push( rec.get('nodeKey') ) ;
					return false ;
				}
			},this) ;
		}
		return Ext.JSON.encode(checkedKeys) ;
	},
	
	setRawValue: function( strChecked ) {
		if( !this.mytree ) {
			// console.log('not ready') ;
		}
		else {
			if( strChecked ) {
				var arrayChecked = Ext.JSON.decode(strChecked) ;
				this.mytree.getRootNode().cascadeBy(function(rec){
					if( Ext.Array.contains( arrayChecked , rec.get('nodeKey') ) ) {
						rec.set('checked',true) ;
						rec.cascadeBy(function(childrec){
							childrec.set('checked',true) ;
						},this) ;
						return false ;
					}
					else {
						rec.set('checked',false) ;
					}
				},this) ;
			}
		}
	},
	
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		if (curvalue.length < 1) {
			if (!this.allowBlank) {
					errors.push(this.blankText);
			}
			return errors;
		}
	},
	markInvalid: function( arrErrors ) {
		if( this.mytree ) {
			//console.log('tree is marked invalid!! with'+this.invalidCls) ;
			this.mytree.getView().addCls( this.invalidCls ) ;
		}
		// this.callParent(arguments) ;
	},
	clearInvalid: function( arrErrors ) {
		if( this.mytree ) {
			//console.log('tree is marked invalid!! with'+this.invalidCls) ;
			this.mytree.getView().removeCls( this.invalidCls ) ;
		}
		// this.callParent(arguments) ;
	}
	

    // and here overriding valueToRaw and so on
    // ...
});
